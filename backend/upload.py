import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

class ImageUploader:
    @staticmethod
    def upload_product_image(file, product_id=None):
        try:
            folder = f"mini-shop/products/{product_id}" if product_id else "mini-shop/products"
            result = cloudinary.uploader.upload(
                file,
                folder=folder,
                resource_type="auto"
            )
            return {
                'url': result['secure_url'],
                'public_id': result['public_id']
            }
        except Exception as e:
            print(f"Upload failed: {e}")
            return None
