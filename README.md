# Maternal Health Monitoring System

A comprehensive maternal health monitoring application with multi-role authentication and risk prediction.

## Features

- **Multi-Role Authentication**: Patient, Partner (Husband/Family), and ASHA Worker accounts
- **Health Risk Prediction**: ML-based maternal risk assessment
- **Health Records**: Complete history of assessments and lab results
- **Real-time Notifications**: Alert system for high-risk cases
- **Secure Database**: Supabase backend with Row Level Security
- **Voice & OCR Input**: Multiple data entry methods (coming soon)

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Application

```bash
./start.sh
```

Or directly:

```bash
streamlit run app.py
```

The app will start at `http://localhost:8501`

## Test Accounts

### Patient Account
- **Email**: patient@test.com
- **Password**: patient123

### Partner Account
- **Email**: partner@test.com
- **Password**: partner123

### ASHA Worker Account
- **Email**: asha@test.com
- **Password**: asha123

## User Roles

### Patient
- View personal health dashboard
- Enter lab values and symptoms
- Get risk predictions
- View health history
- Receive notifications
- Update profile information

### Partner (Husband/Family)
- View linked patient's health records
- Monitor patient's risk assessments
- Receive notifications about patient's health

### ASHA Worker
- Manage multiple patients
- Enter health data for assigned patients
- View all patient records
- Send notifications and alerts

## Database Schema

The application uses Supabase with the following tables:

- **users**: User accounts with role-based access
- **patient_profiles**: Extended patient information
- **health_records**: Lab results and risk assessments
- **notifications**: Alert and notification history

## Security Features

- Password hashing with bcrypt
- Row Level Security (RLS) policies
- Role-based access control
- Phone number verification with country codes
- Secure session management

## Data Privacy

All patient data is protected through:
- Database-level security policies
- Encrypted password storage
- Role-based data isolation
- HIPAA-compliant design principles

## Architecture

```
app.py                  # Main Streamlit application
auth_service.py         # User authentication
health_service.py       # Health records management
db_config.py           # Database connection
engine.py              # Risk prediction engine
model_loader.py        # ML model loader
notification_service.py # Alert dispatcher
ocr_service.py         # OCR integration (pending)
voice_service.py       # Voice input parser (pending)
```

## Development

### Adding New Features

1. Update database schema via migrations
2. Add service methods in appropriate service files
3. Update UI in app.py
4. Test with different user roles

### Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_SUPABASE_ANON_KEY=<your-supabase-key>
```

## Support

For issues or questions, please contact the development team.
