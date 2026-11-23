import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { REPORT_REASONS } from '../utils/mockData';
import { reportUserApi } from '../api/chats';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';

export const ReportModal = ({
  isOpen,
  onClose,
  reportedUser,
}) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await reportUserApi({
        reportedUserId: reportedUser?.id,
        reason,
        details,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Member">
      {submitted ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-white">Report Received</h4>
          <p className="text-xs text-gray-300">
            Thank you for helping keep SparkConnect safe. Our moderators will review this promptly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
            <span>
              Reporting: <strong>{reportedUser?.name || reportedUser?.pseudonym || 'Member'}</strong>. We take all safety reports seriously.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full min-h-touch px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-100 text-sm focus:border-pink-500 focus:outline-none"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Additional Details (Optional)
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide any context or specifics that will help our trust team..."
              className="w-full p-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-100 text-sm focus:border-pink-500 focus:outline-none placeholder:text-gray-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isSubmitting}
            >
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ReportModal;
