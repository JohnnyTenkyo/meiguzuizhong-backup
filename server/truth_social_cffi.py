import sys
import json
import os
from curl_cffi import requests

# Truth Social API 配置
ACCESS_TOKEN = os.getenv('TRUTHSOCIAL_ACCESS_TOKEN', '')
BASE_URL = 'https://truthsocial.com/api/v1'

def get_posts(handle, limit=20):
    """获取用户的 Truth Social 帖子"""
    try:
        # 查找用户 ID
        search_url = f"{BASE_URL}/accounts/lookup?acct={handle}"
        headers = {
            'Authorization': f'Bearer {ACCESS_TOKEN}',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
        
        # 使用 curl-cffi 模拟真实浏览器
        response = requests.get(search_url, headers=headers, impersonate="chrome110")
        
        if response.status_code != 200:
            print(json.dumps({'error': f'Failed to lookup user: {response.status_code}'}), file=sys.stderr)
            return []
        
        user_data = response.json()
        user_id = user_data.get('id')
        
        if not user_id:
            print(json.dumps({'error': 'User ID not found'}), file=sys.stderr)
            return []
        
        # 获取用户帖子
        statuses_url = f"{BASE_URL}/accounts/{user_id}/statuses?limit={limit}"
        response = requests.get(statuses_url, headers=headers, impersonate="chrome110")
        
        if response.status_code != 200:
            print(json.dumps({'error': f'Failed to get statuses: {response.status_code}'}), file=sys.stderr)
            return []
        
        posts = response.json()
        
        # 转换为标准格式
        result = []
        for post in posts:
            result.append({
                'id': post.get('id', ''),
                'text': post.get('content', '').replace('<p>', '').replace('</p>', '').replace('<br />', '\n'),
                'created_at': post.get('created_at', ''),
                'favourites_count': post.get('favourites_count', 0),
                'reblogs_count': post.get('reblogs_count', 0),
                'replies_count': post.get('replies_count', 0),
                'url': post.get('url', ''),
            })
        
        return result
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        return []

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Missing command'}), file=sys.stderr)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'get_posts':
        if len(sys.argv) < 3:
            print(json.dumps({'error': 'Missing handle'}), file=sys.stderr)
            sys.exit(1)
        
        handle = sys.argv[2]
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 20
        
        posts = get_posts(handle, limit)
        print(json.dumps(posts))
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
