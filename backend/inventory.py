import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import get_db, Product

# ... កូដដែលនៅសល់ដូចដើម
from models import get_db, Product

class InventoryManager:
    @staticmethod
    def check_stock(product_id, quantity_needed):
        db = next(get_db())
        product = db.query(Product).get(product_id)
        if not product:
            return {'available': False, 'message': 'Product not found'}
        if product.stock < quantity_needed:
            return {'available': False, 'message': f'Only {product.stock} left'}
        return {'available': True}
    
    @staticmethod
    def reserve_stock(order):
        db = next(get_db())
        for item in order.items:
            product = db.query(Product).get(item['id'])
            if product:
                product.stock -= item['quantity']
        db.commit()
    
    @staticmethod
    def get_low_stock_products():
        db = next(get_db())
        return [{'id': p.id, 'name': p.name, 'stock': p.stock} for p in db.query(Product).filter(Product.stock <= 5, Product.is_active == 1).all()]
    
    @staticmethod
    def restock_product(product_id, quantity):
        db = next(get_db())
        product = db.query(Product).get(product_id)
        if product:
            product.stock += quantity
            db.commit()
            return {'success': True, 'new_stock': product.stock}
        return {'success': False}
    
    @staticmethod
    def get_inventory_report():
        db = next(get_db())
        products = db.query(Product).all()
        return {'total_products': len(products), 'total_value': sum(p.stock * p.price for p in products), 'out_of_stock': [p.name for p in products if p.stock == 0], 'low_stock': [p.name for p in products if 0 < p.stock <= 5]}
