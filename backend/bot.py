import sys
import os

# បន្ថែមថតបច្ចុប្បន្ន (backend) ទៅក្នុង sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# ឥឡូវនេះ Python អាចរកឃើញ models, notifications, inventory
import json
from dotenv import load_dotenv
from telegram import Update, LabeledPrice, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, PreCheckoutQueryHandler, CallbackQueryHandler
from models import get_db, Order, OrderStatus, Voucher
from notifications import NotificationService
from inventory import InventoryManager
from datetime import datetime

load_dotenv()

BOT_TOKEN = os.getenv('8670790936:AAGrR4VaeKXIrB5fTE8vb5LUPSw2oU6keqk')
ADMIN_USER_ID = int(os.getenv('661892014', 0))
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://kimhongy.github.io/luong/')

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🛍️ Open Shop", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton("📊 Dashboard", web_app=WebAppInfo(url=f"{WEBAPP_URL}/dashboard.html")), InlineKeyboardButton("🔍 Search", web_app=WebAppInfo(url=f"{WEBAPP_URL}/search.html"))],
        [InlineKeyboardButton("ℹ️ Help", callback_data="help")]
    ]
    await update.message.reply_text("🌟 *Welcome to Mini Shop!*\n\n• Browse products\n• Pay with Telegram Stars\n• Track your orders", reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')

async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data = json.loads(update.effective_message.web_app_data.data)
    user = update.effective_user
    if data.get('action') == 'create_invoice':
        payload = data.get('payload', {})
        items = payload.get('items', [])
        total_amount = payload.get('totalAmount', 0)
        voucher_code = payload.get('voucherCode')
        
        for item in items:
            result = InventoryManager.check_stock(item['id'], item['quantity'])
            if not result['available']:
                await update.effective_message.reply_text(f"❌ {item['name']}: {result['message']}")
                return
        
        db = next(get_db())
        order = Order(user_id=user.id, username=user.username, first_name=user.first_name, items=items, total_amount=total_amount)
        db.add(order)
        db.commit()
        
        discount = 0
        if voucher_code:
            voucher = db.query(Voucher).filter(Voucher.code == voucher_code, Voucher.is_active == 1, Voucher.current_uses < Voucher.max_uses).first()
            if voucher:
                discount = (total_amount * voucher.discount_percent / 100) if voucher.discount_percent else (voucher.discount_amount or 0)
                voucher.current_uses += 1
                db.commit()
        
        InventoryManager.reserve_stock(order)
        
        stars_total = sum([item.get('stars_price', 0) * item['quantity'] for item in items])
        if discount > 0 and voucher_code:
            v = db.query(Voucher).filter(Voucher.code == voucher_code).first()
            if v and v.discount_percent:
                stars_total = max(1, int(stars_total * (1 - v.discount_percent / 100)))
        
        title = "Mini Shop Order"
        description = "\n".join([f"• {item['name']} x{item['quantity']} - ${item['price'] * item['quantity']:.2f}" for item in items])
        if discount > 0: description += f"\n\nDiscount: -${discount:.2f}"
        description += f"\n\nTotal: ${total_amount - discount:.2f}"
        
        await context.bot.send_invoice(chat_id=user.id, title=title, description=description, payload=f"order_{order.id}", provider_token="", currency="XTR", prices=[LabeledPrice("Total", stars_total)], start_parameter="shop_order", need_name=True, need_phone_number=True)

async def precheckout_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.pre_checkout_query.answer(ok=True)

async def successful_payment_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    payment = update.effective_message.successful_payment
    order_id = int(payment.invoice_payload.split('_')[1])
    db = next(get_db())
    order = db.query(Order).get(order_id)
    if order:
        order.status = OrderStatus.PAID
        order.telegram_payment_id = payment.telegram_payment_charge_id
        order.paid_at = datetime.utcnow()
        db.commit()
        await NotificationService.notify_admin(context=context, title='🎉 New Order!', message=f'Customer: {order.first_name}\nOrder: #{order.id}\nTotal: ${order.total_amount:.2f}')
        await NotificationService.notify_order_update(context=context, order=order, old_status='pending', new_status='paid')
        if order.total_amount >= 50:
            await NotificationService.send_notification(context=context, user_id=order.user_id, title='🎁 Special Offer!', message='Use code THANKYOU10 for 10% off next order!', ntype='promotion')
        await update.effective_message.reply_text(f"✅ *Payment Successful!*\n\nOrder: #{order.id}\nThank you! 🙏", parse_mode='Markdown')

async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_USER_ID:
        await update.message.reply_text("⛔ Unauthorized")
        return
    keyboard = [[InlineKeyboardButton("⚙️ Admin Panel", web_app=WebAppInfo(url=f"{WEBAPP_URL}/admin.html"))]]
    await update.message.reply_text("Admin Panel:", reply_markup=InlineKeyboardMarkup(keyboard))

async def help_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await update.callback_query.message.reply_text("🛍️ *Commands*\n/start - Open shop\n/admin - Admin panel\n\n*Payment*: Telegram Stars", parse_mode='Markdown')

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("admin", admin_command))
    app.add_handler(CallbackQueryHandler(help_callback, pattern="help"))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))
    app.add_handler(PreCheckoutQueryHandler(precheckout_callback))
    app.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment_callback))
    print("Bot is running...")
    app.run_polling()

if __name__ == '__main__':
    main()
