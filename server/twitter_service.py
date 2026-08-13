#!/usr/bin/env python3
"""
Twitter Service - 使用 twikit 库获取推文
这是一个独立的 Python 服务，通过 HTTP API 暴露给 Node.js 调用
"""

from flask import Flask, jsonify, request
import json
import logging
from typing import List, Dict, Any
import asyncio
import os
from twikit import Client

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# 全局 Twitter 客户端
twitter_client = None

def get_client():
    """获取或创建 Twitter 客户端"""
    global twitter_client
    
    if twitter_client is None:
        try:
            logger.info("[Twitter Service] Initializing twikit client...")
            
            # 创建客户端
            # twifork 以 twikit 模块名提供兼容接口，并通过浏览器 TLS 指纹
            # 适配 X 当前的交易校验，降低有效 Cookie 被 403 拒绝的概率。
            twitter_client = Client(language='en-US', impersonate='chrome124')
            
            # 获取凭证
            auth_token = os.environ.get('TWIKIT_AUTH_TOKEN')
            ct0 = os.environ.get('TWIKIT_CT0')
            guest_id = os.environ.get('TWIKIT_GUEST_ID')
            
            if not auth_token or not ct0:
                logger.error("[Twitter Service] Missing TWIKIT_AUTH_TOKEN or TWIKIT_CT0")
                return None
            
            # 设置 cookies
            cookies = {
                'auth_token': auth_token,
                'ct0': ct0,
            }
            
            if guest_id:
                cookies['guest_id'] = guest_id
            
            logger.info("[Twitter Service] Setting cookies for authentication...")
            twitter_client.set_cookies(cookies)
            
            logger.info("[Twitter Service] Client initialized successfully")
            return twitter_client
            
        except Exception as e:
            logger.error(f"[Twitter Service] Failed to initialize client: {e}")
            return None
    
    return twitter_client

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({'status': 'ok'})

@app.route('/tweets', methods=['GET'])
def get_tweets():
    """获取用户推文"""
    try:
        username = request.args.get('username', '')
        count = request.args.get('count', '20', type=int)
        
        if not username:
            return jsonify({'error': 'username is required'}), 400
        
        logger.info(f"[Twitter Service] Fetching {count} tweets for @{username}")
        
        client = get_client()
        if not client:
            return jsonify({'error': 'Failed to initialize Twitter client'}), 500
        
        try:
            # 异步函数包装
            async def fetch_tweets():
                try:
                    logger.info(f"[Twitter Service] Fetching tweets for @{username}...")
                    
                    # twikit 的 get_user_tweets 需要用户 ID，不能直接传 screen name。
                    user = await client.get_user_by_screen_name(username)
                    user_id = str(user.id) if user and hasattr(user, 'id') else ''
                    if not user_id:
                        logger.warning(f"[Twitter Service] User @{username} not found")
                        return []

                    # 获取用户推文（仅原创推文）
                    result = await client.get_user_tweets(user_id, tweet_type='Tweets', count=count)
                    
                    if not result or not result.data:
                        logger.warning(f"[Twitter Service] No tweets found for @{username}")
                        return []
                    
                    tweets = []
                    for tweet in result.data:
                        try:
                            tweet_data = {
                                'id': str(tweet.id) if hasattr(tweet, 'id') else '',
                                'text': tweet.text if hasattr(tweet, 'text') else '',
                                'created_at': str(tweet.created_at) if hasattr(tweet, 'created_at') else '',
                                'retweet_count': tweet.retweet_count if hasattr(tweet, 'retweet_count') else 0,
                                'favorite_count': tweet.favorite_count if hasattr(tweet, 'favorite_count') else 0,
                                'reply_count': tweet.reply_count if hasattr(tweet, 'reply_count') else 0,
                                'quote_count': tweet.quote_count if hasattr(tweet, 'quote_count') else 0,
                            }
                            
                            # 检查是否为转推和回复
                            text = tweet_data['text']
                            tweet_data['is_retweet'] = text.startswith('RT @')
                            tweet_data['is_reply'] = hasattr(tweet, 'in_reply_to_status_id') and tweet.in_reply_to_status_id is not None
                            
                            tweets.append(tweet_data)
                        except Exception as e:
                            logger.warning(f"[Twitter Service] Error processing tweet: {e}")
                            continue
                    
                    logger.info(f"[Twitter Service] Successfully fetched {len(tweets)} tweets for @{username}")
                    return tweets
                    
                except Exception as e:
                    logger.error(f"[Twitter Service] Error in fetch_tweets: {e}")
                    import traceback
                    traceback.print_exc()
                    return []
            
            # 运行异步函数
            tweets = asyncio.run(fetch_tweets())
            
            return jsonify({'tweets': tweets})
            
        except Exception as e:
            logger.error(f"[Twitter Service] Error fetching tweets for @{username}: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e), 'tweets': []}), 500
            
    except Exception as e:
        logger.error(f"[Twitter Service] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/user', methods=['GET'])
def get_user():
    """获取用户信息"""
    try:
        username = request.args.get('username', '')
        
        if not username:
            return jsonify({'error': 'username is required'}), 400
        
        logger.info(f"[Twitter Service] Fetching user profile for @{username}")
        
        client = get_client()
        if not client:
            return jsonify({'error': 'Failed to initialize Twitter client'}), 500
        
        try:
            # 异步函数包装
            async def fetch_user():
                try:
                    # 获取用户信息
                    user = await client.get_user_by_screen_name(username)
                    
                    if not user:
                        logger.warning(f"[Twitter Service] User @{username} not found")
                        return None
                    
                    user_data = {
                        'id': str(user.id) if hasattr(user, 'id') else '',
                        'username': user.username if hasattr(user, 'username') else username,
                        'name': user.name if hasattr(user, 'name') else '',
                        'description': user.description if hasattr(user, 'description') else '',
                        'followers_count': user.followers_count if hasattr(user, 'followers_count') else 0,
                        'verified': user.verified if hasattr(user, 'verified') else False,
                        'profile_image_url': user.profile_image_url if hasattr(user, 'profile_image_url') else '',
                    }
                    
                    return user_data
                except Exception as e:
                    logger.error(f"[Twitter Service] Error in fetch_user: {e}")
                    import traceback
                    traceback.print_exc()
                    return None
            
            # 运行异步函数
            user_data = asyncio.run(fetch_user())
            
            if user_data:
                logger.info(f"[Twitter Service] Successfully fetched user profile for @{username}")
                return jsonify(user_data)
            else:
                return jsonify({'error': 'User not found'}), 404
            
        except Exception as e:
            logger.error(f"[Twitter Service] Error fetching user profile for @{username}: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500
            
    except Exception as e:
        logger.error(f"[Twitter Service] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("[Twitter Service] Starting Twitter service on port 5000")
    app.run(host='127.0.0.1', port=5000, debug=False)
