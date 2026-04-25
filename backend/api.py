from flask import Flask, request, jsonify
from flask_cors import CORS
from models import get_db, Product, Order, Voucher, Review, OrderStatus
from inventory import InventoryManager
from upload import ImageUploader
from sqlalchemy import func
import base64

app = Flask(__name__)
CORS(app)

@app.route('/api/products', methods=['GET'])
def get_products():
    db = next(get_db())
    products = db.query(Product).filter(Product.is_active == 1).all()
    return jsonify([{'id': p.id, 'name': p.name, 'description': p.description, 'price': p.price, 'stars_price': p.stars_price, 'image_url': p.image_url, 'stock': p.stock, 'category': p.category, 'rating': p.rating, 'total_reviews': p.total_reviews} for p in products])

@app.route('/api/products', methods=['POST'])
def add_product():
    db = next(get_db())
    data = request.json
    product = Product(name=data['name'], description=data.get('description', ''), price=data['price'], stars_price=data['stars_price'], image_url=data.get('image_url', ''), stock=data.get('stock', 0), category=data.get('category', 'General'))
    db.add(product)
    db.commit()
    return jsonify({'message': 'Added', 'id': product.id}), 201

@app.route('/api/products/<int:pid>', methods=['GET'])
def get_product(pid):
    db = next(get_db())
    p = db.query(Product).get(pid)
    if not p: return jsonify({'error': 'Not found'}), 404
    return jsonify({'id': p.id, 'name': p.name, 'description': p.description, 'price': p.price, 'stars_price': p.stars_price, 'image_url': p.image_url, 'stock': p.stock, 'category': p.category, 'rating': p.rating, 'total_reviews': p.total_reviews})

@app.route('/api/products/<int:pid>', methods=['PUT'])
def update_product(pid):
    db = next(get_db())
    p = db.query(Product).get(pid)
    if not p: return jsonify({'error': 'Not found'}), 404
    data = request.json
    for k in ['name', 'description', 'price', 'stars_price', 'image_url', 'stock', 'category', 'is_active']:
        if k in data: setattr(p, k, data[k])
    db.commit()
    return jsonify({'message': 'Updated'})

@app.route('/api/products/<int:pid>', methods=['DELETE'])
def delete_product(pid):
    db = next(get_db())
    p = db.query(Product).get(pid)
    if p:
        p.is_active = 0
        db.commit()
    return jsonify({'message': 'Deleted'})

@app.route('/api/products/search', methods=['GET'])
def search_products():
    db = next(get_db())
    q = request.args.get('q', '')
    cat = request.args.get('category', '')
    query = db.query(Product).filter(Product.is_active == 1)
    if q: query = query.filter(Product.name.ilike(f'%{q}%') | Product.description.ilike(f'%{q}%'))
    if cat: query = query.filter(Product.category == cat)
    return jsonify([{'id': p.id, 'name': p.name, 'price': p.price, 'stars_price': p.stars_price, 'image_url': p.image_url, 'stock': p.stock, 'category': p.category, 'rating': p.rating} for p in query.limit(30).all()])

@app.route('/api/categories', methods=['GET'])
def get_categories():
    db = next(get_db())
    return jsonify([c[0] for c in db.query(Product.category).filter(Product.is_active == 1).distinct().all() if c[0]])

@app.route('/api/orders', methods=['GET'])
def get_orders():
    db = next(get_db())
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return jsonify([{'id': o.id, 'user_id': o.user_id, 'username': o.username, 'first_name': o.first_name, 'items': o.items, 'total_amount': o.total_amount, 'status': o.status.value, 'created_at': o.created_at.isoformat()} for o in orders])

@app.route('/api/orders/<int:oid>/status', methods=['PUT'])
def update_order_status(oid):
    db = next(get_db())
    o = db.query(Order).get(oid)
    if o:
        o.status = request.json.get('status')
        db.commit()
    return jsonify({'message': 'Updated'})

@app.route('/api/customer/orders', methods=['GET'])
def customer_orders():
    uid = request.args.get('user_id', type=int)
    db = next(get_db())
    orders = db.query(Order).filter(Order.user_id == uid).order_by(Order.created_at.desc()).all()
    return jsonify([{'id': o.id, 'items': o.items, 'total_amount': o.total_amount, 'status': o.status.value, 'created_at': o.created_at.isoformat()} for o in orders])

@app.route('/api/customer/stats', methods=['GET'])
def customer_stats():
    uid = request.args.get('user_id', type=int)
    db = next(get_db())
    orders = db.query(Order).filter(Order.user_id == uid).all()
    total = sum(o.total_amount for o in orders if o.status in [OrderStatus.PAID, OrderStatus.DELIVERED])
    done = len([o for o in orders if o.status in [OrderStatus.PAID, OrderStatus.DELIVERED]])
    return jsonify({'total_spent': total, 'total_orders': len(orders), 'completed_orders': done, 'pending_orders': len([o for o in orders if o.status == OrderStatus.PENDING]), 'average_order_value': total / done if done > 0 else 0})

@app.route('/api/upload', methods=['POST'])
def upload_image():
    data = request.json
    image_data = data.get('image')
    if not image_data: return jsonify({'error': 'No image'}), 400
    image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
    result = ImageUploader.upload_product_image(image_bytes, data.get('product_id'))
    if result:
        if data.get('product_id'):
            db = next(get_db())
            p = db.query(Product).get(data['product_id'])
            if p:
                p.image_url = result['url']
                db.commit()
        return jsonify(result)
    return jsonify({'error': 'Upload failed'}), 500

@app.route('/api/inventory/check', methods=['POST'])
def check_inventory():
    return jsonify(InventoryManager.check_stock(request.json.get('product_id'), request.json.get('quantity', 1)))

@app.route('/api/inventory/low-stock', methods=['GET'])
def low_stock():
    return jsonify(InventoryManager.get_low_stock_products())

@app.route('/api/inventory/restock', methods=['POST'])
def restock():
    return jsonify(InventoryManager.restock_product(request.json.get('product_id'), request.json.get('quantity', 1)))

@app.route('/api/inventory/report', methods=['GET'])
def inventory_report():
    return jsonify(InventoryManager.get_inventory_report())

@app.route('/api/reviews', methods=['POST'])
def add_review():
    data = request.json
    db = next(get_db())
    review = Review(product_id=data['product_id'], user_id=data['user_id'], username=data.get('username'), first_name=data.get('first_name'), rating=data['rating'], comment=data.get('comment', ''), is_verified=1 if data.get('order_id') else 0)
    db.add(review)
    Product.update_product_rating(db, data['product_id'])
    db.commit()
    return jsonify({'message': 'Added'}), 201

@app.route('/api/reviews/<int:pid>', methods=['GET'])
def get_reviews(pid):
    db = next(get_db())
    avg = db.query(func.avg(Review.rating)).filter(Review.product_id == pid).scalar() or 0
    reviews = db.query(Review).filter(Review.product_id == pid).order_by(Review.created_at.desc()).limit(20).all()
    return jsonify({'average_rating': round(float(avg), 1), 'total_reviews': len(reviews), 'reviews': [{'id': r.id, 'first_name': r.first_name or 'Anonymous', 'rating': r.rating, 'comment': r.comment, 'is_verified': bool(r.is_verified), 'created_at': r.created_at.isoformat()} for r in reviews]})

@app.route('/api/vouchers', methods=['GET'])
def get_vouchers():
    db = next(get_db())
    return jsonify([{'id': v.id, 'code': v.code, 'discount_percent': v.discount_percent, 'discount_amount': v.discount_amount, 'max_uses': v.max_uses, 'current_uses': v.current_uses, 'is_active': v.is_active} for v in db.query(Voucher).all()])

@app.route('/api/vouchers', methods=['POST'])
def add_voucher():
    db = next(get_db())
    data = request.json
    v = Voucher(code=data['code'], discount_percent=data.get('discount_percent'), discount_amount=data.get('discount_amount'), max_uses=data.get('max_uses', 100))
    db.add(v)
    db.commit()
    return jsonify({'message': 'Created', 'id': v.id}), 201

@app.route('/api/vouchers/validate', methods=['POST'])
def validate_voucher():
    db = next(get_db())
    v = db.query(Voucher).filter(Voucher.code == request.json.get('code'), Voucher.is_active == 1, Voucher.current_uses < Voucher.max_uses).first()
    if v: return jsonify({'valid': True, 'discount_percent': v.discount_percent, 'discount_amount': v.discount_amount})
    return jsonify({'valid': False}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
