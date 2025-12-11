# Groq AI Setup Guide

## Overview

School 360 now uses **Groq** for AI-powered features. Groq provides blazing fast AI inference with a generous free tier - perfect for schools!

## Why Groq?

- **100% Free**: 500,000 tokens per day on the free tier
- **Lightning Fast**: Up to 10x faster than traditional AI APIs
- **No Credit Card Required**: Get started immediately
- **OpenAI Compatible**: Works seamlessly with existing code

## Getting Your Free API Key

### Step 1: Create a Groq Account

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up with your email or GitHub account
3. No credit card required!

### Step 2: Generate an API Key

1. Once logged in, navigate to **API Keys** in the sidebar
2. Click **Create API Key**
3. Give it a descriptive name (e.g., "School 360 Production")
4. Copy the API key (starts with `gsk_...`)

### Step 3: Configure in School 360

1. Log into School 360 as an administrator
2. Go to **Settings** → **AI Configuration**
3. Paste your Groq API key in the **Groq API Key** field
4. Select your preferred model (default: **Llama 3.1 8B Instant**)
5. Click **Test Connection** to verify
6. Click **Save Configuration**

## Available Models

School 360 supports the following Groq models:

### Llama 3.1 8B Instant (Recommended)
- **Speed**: Extremely fast (up to 1000+ tokens/second)
- **Best for**: Quick responses, daily operations, general tasks
- **Context**: 128K tokens
- **Use when**: You need speed and the task is straightforward

### Llama 3.3 70B Versatile
- **Speed**: Fast (hundreds of tokens/second)
- **Best for**: Complex reasoning, detailed analysis
- **Context**: 128K tokens
- **Use when**: Task requires deeper thinking and better understanding

### Mixtral 8x7B
- **Speed**: Very fast
- **Best for**: Balanced performance for varied tasks
- **Context**: 32K tokens
- **Use when**: You need a good balance of speed and quality

### Gemma 2 9B
- **Speed**: Fast
- **Best for**: Instruction following, task completion
- **Context**: 8K tokens
- **Use when**: Tasks involve specific instructions

## Free Tier Limits

| Feature | Free Tier |
|---------|-----------|
| **Daily Token Limit** | 500,000 tokens |
| **Requests per Minute** | 30 |
| **Requests per Day** | Unlimited (within token limit) |
| **Cost** | $0.00 |

### What are 500,000 tokens?

For context:
- **Average report analysis**: ~500 tokens
- **Student profile generation**: ~1,000 tokens
- **Daily school summary**: ~2,000 tokens

This means you can process approximately **1,000 AI tasks per day** for free!

## AI-Powered Features in School 360

Once configured, Groq powers these features:

### 🎯 Core Features
- **Report Analysis**: Automatic analysis of student reports
- **At-Risk Detection**: Identify students who need attention
- **Task Suggestions**: AI-generated task recommendations
- **School Health Reports**: Comprehensive school analytics

### 📝 Content Generation
- **Lesson Planning**: AI-assisted lesson plan creation
- **Social Media**: Auto-generate engaging posts
- **Communication**: Smart message templates

### 📊 Analytics & Insights
- **Predictive Analytics**: Forecast trends and patterns
- **Risk Assessment**: Early warning systems
- **Performance Analysis**: Student and staff insights

### 💬 Interactive Features
- **AI Assistant**: Chat with the school AI assistant
- **UPSS GPT**: Policy and procedure inquiries
- **Smart Recommendations**: Personalized suggestions

## Configuration Best Practices

### Security
- ✅ Keep your API key secure and private
- ✅ Don't share API keys in screenshots or documentation
- ✅ Rotate keys periodically for security
- ❌ Never commit API keys to version control

### Performance
- Use **Llama 3.1 8B** for routine tasks (faster, more efficient)
- Switch to **Llama 3.3 70B** for complex analysis
- Monitor your daily token usage in Groq console

### Token Management
- Review token usage weekly in the Groq console
- Optimize prompts to use fewer tokens
- The free tier resets daily at midnight UTC

## Troubleshooting

### Connection Failed
**Error**: "Connection failed: 401 Unauthorized"
- **Solution**: Check that your API key is correct and active

**Error**: "Connection failed: 429 Too Many Requests"
- **Solution**: You've hit rate limits. Wait a minute and try again

**Error**: "Connection failed: Network error"
- **Solution**: Check your internet connection and firewall settings

### AI Not Working
1. Go to Settings → AI Configuration
2. Click "Test Connection"
3. If test fails, regenerate your API key in Groq console
4. Update the key in School 360

### Unexpected Responses
- Some models work better for certain tasks
- Try switching models in Settings
- Llama 3.3 70B is better for complex reasoning
- Llama 3.1 8B is faster for simple tasks

## Migration from OpenRouter

If you previously used OpenRouter:

1. Your old API key field is still supported (backward compatibility)
2. New installations should use the `groq_api_key` field
3. All model references have been updated to Groq models
4. No data migration needed - just update your API key

## Support

### Groq Support
- Documentation: [console.groq.com/docs](https://console.groq.com/docs)
- Community: [discord.gg/groq](https://discord.gg/groq)
- Status: [status.groq.com](https://status.groq.com)

### School 360 Support
- Check the AI Configuration settings page
- Review error messages in browser console (F12)
- Contact your system administrator

## FAQ

**Q: Is Groq really free?**
A: Yes! 500,000 tokens per day with no credit card required.

**Q: What happens if I exceed the free tier?**
A: Requests will be rate-limited but your account stays active. Usage resets daily.

**Q: Can I upgrade if I need more?**
A: Yes, Groq offers paid tiers with higher limits. Visit console.groq.com for pricing.

**Q: How fast is Groq compared to OpenRouter?**
A: Groq is typically 5-10x faster, with some models reaching 1000+ tokens/second.

**Q: Will my old OpenRouter key still work?**
A: No, you need a Groq API key. The migration is simple - just get a free key from Groq.

**Q: Can I use multiple models?**
A: Yes, you can change the default model in Settings or specify models per request.

## Next Steps

1. ✅ Get your free Groq API key
2. ✅ Configure it in School 360 Settings
3. ✅ Test the connection
4. ✅ Start using AI features!

Enjoy the power of fast, free AI for your school! 🚀
