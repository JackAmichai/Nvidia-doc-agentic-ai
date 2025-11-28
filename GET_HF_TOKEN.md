# 🔑 Get Your Free Hugging Face API Token

## Step-by-Step Instructions:

### 1. Go to Hugging Face
Open your browser and visit:
**https://huggingface.co/settings/tokens**

### 2. Sign Up / Log In
- If you don't have an account, click "Sign up" (it's free!)
- If you have an account, just log in

### 3. Create a New Token
- Click the **"New token"** button
- Give it a name (e.g., "nvidia-doc-navigator")
- Select access type: **"Read"** (this is sufficient)
- Click **"Generate token"**

### 4. Copy Your Token
- Your token will start with `hf_`
- Click the copy button or select and copy it
- **IMPORTANT**: Save it somewhere - you won't be able to see it again!

### 5. Add Token to Your Project
```bash
# Navigate to backend directory
cd backend

# Create .env file from the example
cp .env.example .env

# Open .env in your text editor
nano .env  # or: code .env, vim .env, etc.

# Paste your token:
HUGGINGFACE_API_KEY=hf_your_token_here
```

### 6. Save and Test
- Save the `.env` file
- Your token is now configured!

---

## ⚠️ Security Note
- **NEVER** commit your `.env` file to Git
- The `.gitignore` is already configured to exclude it
- Only commit `.env.example` (which has no real tokens)

---

## 🎉 You're Done!
Once you've added your token, you can run the application following the QUICKSTART.md guide.

---

## Alternative: Use OpenAI Instead
If you prefer to use OpenAI (requires a paid account):

1. Get API key from https://platform.openai.com/api-keys
2. Edit `backend/.env`:
   ```bash
   OPENAI_API_KEY=sk-your_openai_key_here
   # Leave blank or comment out:
   # HUGGINGFACE_API_KEY=
   ```

The system will automatically use OpenAI if the key is present.
