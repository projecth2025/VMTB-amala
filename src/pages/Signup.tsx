import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profession, setProfession] = useState('');
  const [hospital, setHospital] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signup({ name, email, password, profession, hospital, phone });
      navigate('/login');
    } catch (err: any) {
      setError(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <Stethoscope className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">VMTB</h1>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Create your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1">
                Profession
              </label>
              <select
                id="profession"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select profession</option>
                <option value="Medical oncologist">Medical oncologist</option>
                <option value="Surgical oncologist">Surgical oncologist</option>
                <option value="Radiation oncologist">Radiation oncologist</option>
                <option value="Hematologist-oncologist">Hematologist-oncologist</option>
                <option value="Radiologist">Radiologist</option>
                <option value="Pathologist">Pathologist</option>
                <option value="Molecular pathologist">Molecular pathologist</option>
                <option value="Medical physicist">Medical physicist</option>
                <option value="Dosimetrist">Dosimetrist</option>
                <option value="Radiation therapist">Radiation therapist</option>
                <option value="Oncology nurse / staff nurse">Oncology nurse / staff nurse</option>
                <option value="Infusion nurse">Infusion nurse</option>
                <option value="Oncology pharmacist">Oncology pharmacist</option>
                <option value="Palliative care specialist">Palliative care specialist</option>
                <option value="Dietitian / oncology nutritionist">Dietitian / oncology nutritionist</option>
                <option value="Genetic counselor">Genetic counselor</option>
                <option value="Cardio-oncologist">Cardio-oncologist</option>
                <option value="Pulmonologist">Pulmonologist</option>
                <option value="Nephrologist">Nephrologist</option>
                <option value="Hepatologist">Hepatologist</option>
                <option value="Endocrinologist">Endocrinologist</option>
                <option value="Oral surgeon">Oral surgeon</option>
                <option value="Administrative staff">Administrative staff</option>
                <option value="Geneticist">Geneticist</option>
              </select>
            </div>

            <div>
              <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 mb-1">
                Hospital Name (Optional)
              </label>
              <input
                id="hospital"
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
