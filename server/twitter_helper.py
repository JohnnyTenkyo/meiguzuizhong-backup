#!/usr/bin/env python3
"""
Twitter Helper Script
使用 twikit 库和用户账号获取 Twitter 数据（完全免费）
"""
import sys
import json
import os
import asyncio
from twikit import Client
from pathlib import Path

# Cookie 文件路径
COOKIES_FILE = Path(__file__).parent / '.twitter_cookies.json'

async def init_client():
    """初始化 Twitter 客户端"""
    client = Client('en-US')
    
    # 尝试从 cookie 文件加载
    if COOKIES_FILE.exists():
        try:
            client.load_cookies(str(COOKIES_FILE))
            return client
        except:
            pass
    
    # 从环境变量获取登录信息
    email = os.environ.get('TWITTER_EMAIL')
    password = os.environ.get('TWITTER_PASSWORD')
    
    if not email or not password:
        raise Exception('TWITTER_EMAIL and TWITTER_PASSWORD environment variables required')
    
    # 登录
    await client.login(
        auth_info_1=email,
        password=password
    )
    
    # 保存 cookies
    client.save_cookies(str(COOKIES_FILE))
    
    return client

async def get_user_tweets_async(username, count=20):
    """获取用户的推文"""
    try:
        client = await init_client()
        
        # 获取用户信息
        user = await client.get_user_by_screen_name(username)
        
        if not user:
            return {'success': False, 'error': f'User @{username} not found'}
        
        # 获取用户推文
        tweets = await user.get_tweets('Tweets', count=count)
        
        # 转换为简化格式
        tweet_list = []
        for tweet in tweets:
            tweet_data = {
                'id': tweet.id,
                'text': tweet.text,
                'created_at': str(tweet.created_at) if hasattr(tweet, 'created_at') else '',
                'retweet_count': tweet.retweet_count if hasattr(tweet, 'retweet_count') else 0,
                'favorite_count': tweet.favorite_count if hasattr(tweet, 'favorite_count') else 0,
                'reply_count': tweet.reply_count if hasattr(tweet, 'reply_count') else 0,
                'quote_count': tweet.quote_count if hasattr(tweet, 'quote_count') else 0,
                'is_retweet': hasattr(tweet, 'retweeted_tweet') and tweet.retweeted_tweet is not None,
                'is_reply': hasattr(tweet, 'in_reply_to_user_id') and tweet.in_reply_to_user_id is not None,
                'user': {
                    'screen_name': user.screen_name,
                    'name': user.name,
                    'followers_count': user.followers_count if hasattr(user, 'followers_count') else 0,
                    'verified': user.verified if hasattr(user, 'verified') else False,
                }
            }
            
            # 添加媒体信息
            if hasattr(tweet, 'media') and tweet.media:
                tweet_data['media'] = []
                for media in tweet.media:
                    media_obj = {'type': 'photo', 'url': ''}
                    if hasattr(media, 'type'):
                        media_obj['type'] = media.type
                    if hasattr(media, 'media_url_https'):
                        media_obj['url'] = media.media_url_https
                    elif hasattr(media, 'url'):
                        media_obj['url'] = media.url
                    tweet_data['media'].append(media_obj)
            
            tweet_list.append(tweet_data)
        
        return {
            'success': True,
            'tweets': tweet_list,
            'count': len(tweet_list)
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

async def get_user_info_async(username):
    """获取用户信息"""
    try:
        client = await init_client()
        
        # 获取用户信息
        user = await client.get_user_by_screen_name(username)
        
        if not user:
            return {'success': False, 'error': f'User @{username} not found'}
        
        user_data = {
            'rest_id': user.id,
            'screen_name': user.screen_name,
            'name': user.name,
            'description': user.description if hasattr(user, 'description') else '',
            'followers_count': user.followers_count if hasattr(user, 'followers_count') else 0,
            'friends_count': user.following_count if hasattr(user, 'following_count') else 0,
            'statuses_count': user.statuses_count if hasattr(user, 'statuses_count') else 0,
            'verified': user.verified if hasattr(user, 'verified') else False,
            'profile_image_url': user.profile_image_url if hasattr(user, 'profile_image_url') else '',
            'created_at': str(user.created_at) if hasattr(user, 'created_at') else '',
        }
        
        return {
            'success': True,
            'user': user_data
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def get_user_tweets(username, count=20):
    """同步包装器"""
    return asyncio.run(get_user_tweets_async(username, count))

def get_user_info(username):
    """同步包装器"""
    return asyncio.run(get_user_info_async(username))

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No command specified'}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'get_tweets':
        if len(sys.argv) < 3:
            print(json.dumps({'success': False, 'error': 'Username required'}))
            sys.exit(1)
        
        username = sys.argv[2]
        count = int(sys.argv[3]) if len(sys.argv) > 3 else 20
        result = get_user_tweets(username, count)
        
    elif command == 'get_user_info':
        if len(sys.argv) < 3:
            print(json.dumps({'success': False, 'error': 'Username required'}))
            sys.exit(1)
        
        username = sys.argv[2]
        result = get_user_info(username)
        
    else:
        result = {'success': False, 'error': f'Unknown command: {command}'}
    
    print(json.dumps(result, default=str))

if __name__ == '__main__':
    main()
