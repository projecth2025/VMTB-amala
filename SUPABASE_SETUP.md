# Supabase Integration - Setup Guide

## Overview
This application is now fully integrated with Supabase for authentication, database, and storage.

## Environment Variables
The `.env` file must contain:
```
VITE_SUPABASE_URL = 'https://togobilqdevoyijxrexc.supabase.co'
VITE_SUPABASE_ANON_KEY = '<your-anon-public-key>'
```

⚠️ **IMPORTANT**: Replace the current key with your Supabase **anon public key** (not the service role key). The service role key should never be exposed in frontend code.

## Required Supabase Setup

### 1. Storage Bucket
Create a storage bucket named: `case-documents`
- Enable public access or configure RLS policies as needed
- This bucket stores NGS reports, clinical documents, and text files

### 2. Database Tables
Ensure these tables exist with the specified columns:

#### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  profession TEXT,
  hospital TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### cases
```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  case_name TEXT NOT NULL,
  patient_name TEXT,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL,
  cancer_type TEXT NOT NULL,
  summary TEXT,
  treatment_plan TEXT,
  follow_up TEXT,
  finalized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### case_documents
```sql
CREATE TABLE case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'NGS', 'Clinical', or 'Text'
  filename TEXT NOT NULL,
  size TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### case_questions
```sql
CREATE TABLE case_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### mtbs
```sql
CREATE TABLE mtbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### mtb_members
```sql
CREATE TABLE mtb_members (
  mtb_id UUID REFERENCES mtbs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (mtb_id, user_id)
);
```

#### mtb_cases
```sql
CREATE TABLE mtb_cases (
  mtb_id UUID REFERENCES mtbs(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (mtb_id, case_id)
);
```

#### case_opinions
```sql
CREATE TABLE case_opinions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Row Level Security (RLS)
Enable RLS on all tables and configure policies based on your security requirements. Example policies:

**Cases**: Users can read cases they own or that are shared in MTBs they're members of.
**Opinions**: Users can insert their own opinions and read all opinions on cases they have access to.
**MTBs**: Users can read MTBs they own or are members of.

## Application Features

### Authentication
- ✅ Email/password signup with profile creation
- ✅ Login with session persistence
- ✅ Password reset flow
- ✅ Protected routes
- ✅ Auto-logout on session expiry

### Case Management
- ✅ Create cases with patient info
- ✅ Upload NGS, Clinical, and Text documents to Supabase Storage
- ✅ AI summary placeholder (ready for future integration)
- ✅ Add questions for MTB review
- ✅ View all owned cases
- ✅ Role-based access (owner vs visitor)

### MTB (Molecular Tumor Board)
- ✅ Create one MTB per user (enforced)
- ✅ Join MTBs via unique join code
- ✅ Add cases to MTBs
- ✅ View cases shared in MTB

### Opinions
- ✅ Submit expert opinions on cases
- ✅ Multiple opinions per user allowed
- ✅ Read-only after submission

### Owner Capabilities
- ✅ Edit treatment plan
- ✅ Edit follow-up notes
- ✅ View all opinions

## Testing the App

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Verify .env file** with correct anon key

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Test flow**:
   - Sign up a new user
   - Create a case (upload documents in Step 2)
   - Review and finalize case
   - Create or join an MTB
   - Add case to MTB
   - View case as owner
   - Submit opinions as visitor (sign up another user)

## Known Limitations

- **AI Summary**: Currently uses mock placeholder text. Backend AI integration needed.
- **File Preview**: Documents are uploaded but not displayed in UI (as per requirements).
- **Profile Data**: Additional profile fields (profession, hospital, phone) stored but not displayed in UI.

## Security Notes

⚠️ **Replace the service role key** in `.env` with the anon public key immediately.
⚠️ Configure RLS policies before deploying to production.
⚠️ Enable email confirmation in Supabase Auth settings for production.

## Future Enhancements

- Integrate AI API for case summaries
- Add real-time notifications for new opinions
- Implement case versioning
- Add MTB discussion threads
- Export case reports as PDF
