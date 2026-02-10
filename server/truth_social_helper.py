#!/usr/bin/env python3
"""
Truth Social Helper Script
使用 curl-cffi 直接调用 Truth Social API，绕过 Cloudflare
"""
import sys
import json
import os
from curl_cffi import requests

# Truth Social API 基础 URL
BASE_URL = "https://truthsocial.com/api/v1"

def get_headers(access_token):
    """构建请求头"""
    return {
        "Authorization": f"Bearer {access_token}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://truthsocial.com/",
        "Origin": "https://truthsocial.com",
    }

def get_posts(username, limit=20):
    """获取用户的帖子"""
    try:
        access_token = os.environ.get('TRUTHSOCIAL_ACCESS_TOKEN')
        
        if not access_token:
            return {'success': False, 'error': 'TRUTHSOCIAL_ACCESS_TOKEN not set'}
        
        # 首先查找用户 ID
        lookup_url = f"{BASE_URL}/accounts/lookup"
        params = {"acct": username}
        headers = get_headers(access_token)
        
        # 使用 curl_cffi 发送请求（绕过 Cloudflare）
        response = requests.get(
            lookup_url,
            params=params,
            headers=headers,
            impersonate="chrome110",
            timeout=10
        )
        
        if response.status_code != 200:
            return {'success': False, 'error': f'Failed to lookup user: {response.status_code}'}
        
        user_data = response.json()
        user_id = user_data.get('id')
        
        if not user_id:
            return {'success': False, 'error': 'User ID not found'}
        
        # 获取用户的帖子
        statuses_url = f"{BASE_URL}/accounts/{user_id}/statuses"
        params = {"limit": limit}
        
        response = requests.get(
            statuses_url,
            params=params,
            headers=headers,
            impersonate="chrome110",
            timeout=10
        )
        
        if response.status_code != 200:
            return {'success': False, 'error': f'Failed to fetch posts: {response.status_code}'}
        
        posts = response.json()
        
        return {
            'success': True,
            'posts': posts,
            'count': len(posts)
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def get_user_info(username):
    """获取用户信息"""
    try:
        access_token = os.environ.get('TRUTHSOCIAL_ACCESS_TOKEN')
        
        if not access_token:
            return {'success': False, 'error': 'TRUTHSOCIAL_ACCESS_TOKEN not set'}
        
        lookup_url = f"{BASE_URL}/accounts/lookup"
        params = {"acct": username}
        headers = get_headers(access_token)
        
        # 使用 curl_cffi 发送请求（绕过 Cloudflare）
        response = requests.get(
            lookup_url,
            params=params,
            headers=headers,
            impersonate="chrome110",
            timeout=10
        )
        
        if response.status_code != 200:
            return {'success': False, 'error': f'Failed to lookup user: {response.status_code}'}
        
        user_info = response.json()
        
        return {
            'success': True,
            'user': user_info
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No command specified'}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'get_posts':
        if len(sys.argv) < 3:
            print(json.dumps({'success': False, 'error': 'Username required'}))
            sys.exit(1)
        
        username = sys.argv[2]
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 20
        result = get_posts(username, limit)
        
    elif command == 'get_user_info':
        if len(sys.argv) < 3:
            print(json.dumps({'success': False, 'error': 'Username required'}))
            sys.exit(1)
        
        username = sys.argv[2]
        result = get_user_info(username)
        
    else:
        result = {'success': False, 'error': f'Unknown command: {command}'}
    
    print(json.dumps(result))

if __name__ == '__main__':
    main()
