import base64
import re

class ImageUploader:
    @staticmethod
    def upload_product_image(image_data, product_id=None):
        """
        រក្សាទុករូបភាពជា Base64 string
        
        Args:
            image_data: Base64 encoded image string ឬ file path
            product_id: មិនប្រើទេ (សម្រាប់ compatibility)
        
        Returns:
            dict ជាមួយ url និង public_id
        """
        try:
            # បើជា Base64 string រួចហើយ
            if isinstance(image_data, str) and image_data.startswith('data:image'):
                # ទាញយកតែផ្នែក Base64
                base64_data = image_data.split(',')[1] if ',' in image_data else image_data
                # បង្កើត Data URL ដើម្បីប្រើជា image source
                url = image_data
                public_id = f"product_{product_id}_{base64.b64encode(base64_data[:10].encode()).decode()}"
                
                return {
                    'url': url,
                    'public_id': public_id
                }
            
            # បើជា bytes (ពី file upload)
            elif isinstance(image_data, bytes):
                base64_data = base64.b64encode(image_data).decode('utf-8')
                url = f"data:image/jpeg;base64,{base64_data}"
                public_id = f"product_{product_id}_{base64_data[:10]}"
                
                return {
                    'url': url,
                    'public_id': public_id
                }
            
            return None
            
        except Exception as e:
            print(f"Upload failed: {e}")
            return None
