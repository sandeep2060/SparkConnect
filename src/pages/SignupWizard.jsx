import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Calendar,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Sparkles,
  User,
  AtSign,
  AlertCircle,
  Flame,
  Phone,
} from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import IntentChips from '../components/IntentChips';
import InterestGrid from '../components/InterestGrid';
import NatureChips from '../components/NatureChips';
import { calculateAge } from '../utils/helpers';
import { GENDERS } from '../utils/mockData';
import { signupApi, checkUsernameUniqueApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export const SignupWizard = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    gender: 'Woman',
    email: '',
    phone: '',
    password: '',
    dob: '2001-05-15',
    mode: 'public', // 'public' | 'stranger'
    pseudonym: 'NeonSpark',
    nature: ['Friendly', 'Naughty', 'Playful'],
    intents: ['romance', 'exploring'],
    interests: ['Coffee & Cafes', 'Live Music', 'Techno'],
  });

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null, // true | false | null
    message: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Real-time username debounce check
  useEffect(() => {
    if (!formData.username.trim()) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus((prev) => ({ ...prev, checking: true }));
      try {
        const result = await checkUsernameUniqueApi(formData.username);
        setUsernameStatus({
          checking: false,
          available: result.available,
          message: result.message,
        });
      } catch (e) {
        setUsernameStatus({
          checking: false,
          available: false,
          message: 'Error verifying username',
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.username]);

  // Validation
  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Please enter your full or display name.');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Please choose a unique username.');
      return false;
    }
    if (usernameStatus.available === false) {
      setError('Please choose an available username before proceeding.');
      return false;
    }
    if (!formData.gender) {
      setError('Please specify your gender identity.');
      return false;
    }
    if (!formData.email || !formData.password || !formData.dob) {
      setError('Please fill in all account fields.');
      return false;
    }
    if (!formData.phone || formData.phone.replace(/[^0-9]/g, '').length < 7) {
      setError('Please enter a valid phone number (at least 7 digits).');
      return false;
    }
    const age = calculateAge(formData.dob);
    if (age === null || age < 18) {
      setError('You must be at least 18 years of age to register.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 3 && formData.nature.length < 2) {
      setError('Please select at least 2 nature traits that describe you.');
      return;
    }
    if (step === 4 && formData.intents.length === 0) {
      setError('Please choose at least one intent.');
      return;
    }
    if (step === 5 && formData.interests.length < 3) {
      setError('Please select at least 3 interests.');
      return;
    }
    setError('');
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleCompleteSignup();
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCompleteSignup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await signupApi(formData);
      setUser(result.user);
      navigate('/verify');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNature = (traitLabel) => {
    const current = formData.nature;
    if (current.includes(traitLabel)) {
      setFormData({ ...formData, nature: current.filter((x) => x !== traitLabel) });
    } else {
      if (current.length < 6) {
        setFormData({ ...formData, nature: [...current, traitLabel] });
      }
    }
  };

  const toggleIntent = (id) => {
    const current = formData.intents;
    if (current.includes(id)) {
      setFormData({ ...formData, intents: current.filter((x) => x !== id) });
    } else {
      setFormData({ ...formData, intents: [...current, id] });
    }
  };

  const toggleInterest = (interest) => {
    const current = formData.interests;
    if (current.includes(interest)) {
      setFormData({ ...formData, interests: current.filter((x) => x !== interest) });
    } else {
      if (current.length < 5) {
        setFormData({ ...formData, interests: [...current, interest] });
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Progress Bar Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
            <span>Step {step} of {totalSteps}</span>
            <span className="text-pink-400">
              {step === 1 && 'Identity & Credentials'}
              {step === 2 && 'Discovery Mode & Pseudonym'}
              {step === 3 && 'Nature & Chemistry Traits'}
              {step === 4 && 'Your Connection Intent'}
              {step === 5 && 'Passions & Interests'}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Step Card */}
        <Card glass className="p-6 sm:p-8 space-y-6 shadow-2xl">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Account, Name, Unique Username, Gender & 18+ DOB */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Create Your Account</h2>
                <p className="text-xs text-gray-400">
                  Join SparkConnect. Adult platform strictly for individuals aged 18 and older.
                </p>
              </div>

              {/* Name & Username Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Display Name"
                  placeholder="e.g. Maya Carter"
                  icon={User}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <div className="space-y-1.5">
                  <Input
                    label="Unique Username"
                    placeholder="e.g. maya_night"
                    icon={AtSign}
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                      })
                    }
                    helperText={
                      usernameStatus.checking
                        ? 'Checking availability...'
                        : usernameStatus.message
                    }
                    error={usernameStatus.available === false ? usernameStatus.message : ''}
                    required
                  />
                  {usernameStatus.available === true && (
                    <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{usernameStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Gender Selector Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Gender Identity
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] ${
                        formData.gender === g
                          ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/30 ring-1 ring-pink-500/50'
                          : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  icon={Mail}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  icon={Phone}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  helperText="Supports signin with phone or email"
                  required
                />
              </div>

              <Input
                label="Create Password"
                type="password"
                placeholder="At least 8 characters"
                icon={Lock}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />

              <Input
                label="Date of Birth (Must be 18+)"
                type="date"
                icon={Calendar}
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                helperText="Your exact birthdate is encrypted and never revealed publicly."
                required
              />
            </div>
          )}

          {/* STEP 2: Choose Mode & Pseudonym */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Select Your Discovery Mode</h2>
                <p className="text-xs text-gray-400">
                  You can seamlessly switch between modes anytime in your profile settings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Public Mode Card */}
                <div
                  onClick={() => setFormData({ ...formData, mode: 'public' })}
                  className={`
                    p-5 rounded-2xl border cursor-pointer transition-all duration-200 select-none
                    ${
                      formData.mode === 'public'
                        ? 'bg-pink-500/15 border-pink-500 ring-2 ring-pink-500/40 shadow-lg'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                      <Eye className="w-5 h-5" />
                    </div>
                    {formData.mode === 'public' && (
                      <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-white">Public Mode</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Show your photos and verified identity openly to spark immediate visual chemistry.
                  </p>
                </div>

                {/* Stranger Mode Card */}
                <div
                  onClick={() => setFormData({ ...formData, mode: 'stranger' })}
                  className={`
                    p-5 rounded-2xl border cursor-pointer transition-all duration-200 select-none
                    ${
                      formData.mode === 'stranger'
                        ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/40 shadow-lg'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-900/60 text-purple-300 flex items-center justify-center">
                      <EyeOff className="w-5 h-5" />
                    </div>
                    {formData.mode === 'stranger' && (
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-white">Stranger Mode</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Keep photos blurred with a mystery pseudonym. Photos only reveal upon mutual consent.
                  </p>
                </div>
              </div>

              {formData.mode === 'stranger' && (
                <div className="animate-fade-in">
                  <Input
                    label="Choose Your Stranger Pseudonym"
                    placeholder="e.g. ShadowVelvet, NeonWanderer"
                    value={formData.pseudonym}
                    onChange={(e) => setFormData({ ...formData, pseudonym: e.target.value })}
                    helperText="This alias will be visible in place of your real name."
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Nature & Chemistry Traits (Introvert, Friendly, Sexual, Naughty, etc.) */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-[11px] font-bold text-pink-400 mb-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Chemistry & Temperament</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">What is Your Nature?</h2>
                <p className="text-xs text-gray-400">
                  Select the personality traits and intimate vibes that describe your spirit and desires.
                </p>
              </div>

              <NatureChips
                selectedTraits={formData.nature}
                onToggle={toggleNature}
                min={2}
                max={6}
              />
            </div>
          )}

          {/* STEP 4: Intent selection */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">What Are You Seeking?</h2>
                <p className="text-xs text-gray-400">
                  Select all that align with your current energy. No judgment, total clarity.
                </p>
              </div>

              <IntentChips
                selectedIntents={formData.intents}
                onToggle={toggleIntent}
              />
            </div>
          )}

          {/* STEP 5: Interests tags */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Pick Your Passions</h2>
                <p className="text-xs text-gray-400">
                  Choose 3 to 5 tags to fuel conversation icebreakers and algorithm discovery.
                </p>
              </div>

              <InterestGrid
                selectedInterests={formData.interests}
                onToggle={toggleInterest}
                min={3}
                max={5}
              />
            </div>
          )}

          {/* Nav Buttons */}
          <div className="pt-4 border-t border-gray-800 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={handleBack}
                icon={ArrowLeft}
              >
                Back
              </Button>
            ) : <div />}

            <Button
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onClick={handleNext}
              icon={step === totalSteps ? ShieldCheck : ArrowRight}
            >
              {step === totalSteps ? 'Complete & Verify' : 'Continue'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignupWizard;
