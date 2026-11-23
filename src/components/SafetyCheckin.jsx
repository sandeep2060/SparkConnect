import React, { useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { ShieldCheck, MapPin, UserCheck, Bell, CheckCircle2 } from 'lucide-react';
import { safetyCheckinApi } from '../api/chats';

export const SafetyCheckin = ({
  isOpen,
  onClose,
  partnerName = 'Date partner',
}) => {
  const [contactName, setContactName] = useState('Jordan (Trusted Contact)');
  const [contactPhone, setContactPhone] = useState('+1 (555) 234-5678');
  const [locationNote, setLocationNote] = useState('Meeting at SoHo Grand Lounge, 310 W Broadway');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendCheckin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await safetyCheckinApi({
        contactName,
        contactPhone,
        notes: locationNote,
      });
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SparkConnect Safety Check-in">
      {isSent ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h4 className="text-lg font-bold text-white">Safety Alert Dispatched!</h4>
          <p className="text-xs text-gray-300 max-w-xs mx-auto">
            Your trusted contact has been notified with your current coordinates and check-in timer.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSendCheckin} className="space-y-4">
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3 text-xs text-purple-200">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-purple-100">Discreet Protection Protocol</p>
              <p className="text-purple-300/90 mt-0.5">
                Share your live date details and set a check-in timer with someone you trust. {partnerName} will not be notified.
              </p>
            </div>
          </div>

          <Input
            label="Trusted Contact Name"
            icon={UserCheck}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
          />

          <Input
            label="Trusted Phone / SMS"
            icon={Bell}
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            required
          />

          <Input
            label="Meeting Location & Details"
            icon={MapPin}
            value={locationNote}
            onChange={(e) => setLocationNote(e.target.value)}
            required
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={ShieldCheck}
            >
              Send Safety Alert
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default SafetyCheckin;
