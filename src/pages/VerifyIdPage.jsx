import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Upload, Camera, FileCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { submitIdVerificationApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export const VerifyIdPage = () => {
  const navigate = useNavigate();
  const { updateProfile } = useAuthStore();

  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [idPreview, setIdPreview] = useState('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80');
  const [selfiePreview, setSelfiePreview] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleIdUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
      setIdPreview(URL.createObjectURL(file));
    }
  };

  const handleSelfieUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await submitIdVerificationApi({ idFile, selfieFile });
      updateProfile({ verificationStatus: 'pending', idDocumentUrl: idPreview, selfieUrl: selfiePreview });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/app');
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-lg mx-auto space-y-6">
        <Card glass className="p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-sky-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Identity Shield Verification</h2>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Please upload a clear photo of your government-issued ID (Passport, Driver License) and a live selfie.
            </p>
          </div>

          {isSuccess ? (
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold text-white">Documents Received!</h3>
              <p className="text-xs text-gray-300 max-w-xs mx-auto">
                Our moderator team will finalize your ID Badge shortly. Redirecting you to the match feed...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ID Document Zone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center justify-between">
                  <span>1. Government ID Document</span>
                  <span className="text-[10px] text-pink-400 lowercase">jpg, png, or pdf</span>
                </label>

                <div className="relative border-2 border-dashed border-gray-700 hover:border-pink-500/60 rounded-2xl p-4 text-center bg-gray-900/60 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleIdUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {idPreview ? (
                    <div className="flex items-center gap-4 text-left">
                      <img
                        src={idPreview}
                        alt="ID Document"
                        className="w-20 h-14 object-cover rounded-xl border border-gray-700 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">Government_ID_Front.jpg</p>
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Ready for upload (Tap to change)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 group-hover:text-pink-400 mx-auto transition-colors" />
                      <p className="text-xs font-semibold text-gray-200">Tap to upload Passport or Driver's License</p>
                      <p className="text-[10px] text-gray-500">Must show full name & date of birth clearly</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Selfie Verification Zone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center justify-between">
                  <span>2. Live Selfie Match</span>
                  <span className="text-[10px] text-pink-400 lowercase">natural lighting</span>
                </label>

                <div className="relative border-2 border-dashed border-gray-700 hover:border-pink-500/60 rounded-2xl p-4 text-center bg-gray-900/60 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleSelfieUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {selfiePreview ? (
                    <div className="flex items-center gap-4 text-left">
                      <img
                        src={selfiePreview}
                        alt="Selfie"
                        className="w-14 h-14 object-cover rounded-full border border-pink-500/50 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">Face_Verification_Selfie.jpg</p>
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Ready for upload (Tap to change)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <Camera className="w-8 h-8 text-gray-400 group-hover:text-pink-400 mx-auto transition-colors" />
                      <p className="text-xs font-semibold text-gray-200">Take or upload a quick selfie</p>
                      <p className="text-[10px] text-gray-500">Hold up your hand or neutral look for parity check</p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoading}
                icon={FileCheck}
              >
                Submit for Instant Moderation
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default VerifyIdPage;
