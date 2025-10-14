// src/components/MyTournamentCard.js
'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FaRegIdCard, FaLock } from 'react-icons/fa';

// Helper component for the status badge
const StatusBadge = ({ status }) => {
  const statusStyles = {
    Upcoming: 'bg-green-500/20 text-green-400 border-green-500/50',
    Live: 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse',
    Completed: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    Cancelled: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  };
  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusStyles[status] || statusStyles.Completed}`}>
      {status}
    </span>
  );
};

// Helper function to format date and time
const formatDateTime = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Date not set';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    }).format(date);
};


const MyTournamentCard = ({ tournament, participantData }) => {
  const router = useRouter();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={cardVariants}
      className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg overflow-hidden flex flex-col justify-between"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-white leading-tight">{tournament.title}</h3>
          <StatusBadge status={tournament.status} />
        </div>
        <p className="text-xs text-gray-400 mb-4">{formatDateTime(tournament.startTime)}</p>

        {/* CONDITIONAL UI FOR LIVE TOURNAMENTS */}
        {tournament.status === 'Live' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="my-4 p-3 bg-red-900/50 border border-red-700 rounded-lg space-y-2 overflow-hidden"
          >
            <h4 className="font-bold text-red-300 text-sm">Room Details (LIVE)</h4>
            <div className="flex items-center space-x-2">
              <FaRegIdCard className="text-red-300" />
              <span className="text-white font-mono text-sm">ID: {tournament.roomID}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaLock className="text-red-300" />
              <span className="text-white font-mono text-sm">Pass: {tournament.roomPassword}</span>
            </div>
          </motion.div>
        )}
        
        {/* CONDITIONAL UI FOR COMPLETED TOURNAMENTS */}
        {tournament.status === 'Completed' && participantData && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="my-4 p-3 bg-gray-700/50 rounded-lg grid grid-cols-3 text-center"
          >
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Your Rank</p>
              <p className="text-lg font-bold text-white">#{participantData.rank > 0 ? participantData.rank : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Kills</p>
              <p className="text-lg font-bold text-white">{participantData.kills}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Winnings</p>
              <p className="text-lg font-bold text-green-400">₹{participantData.winnings.toFixed(0)}</p>
            </div>
          </motion.div>
        )}

      </div>
      <button 
        onClick={() => router.push(`/tournaments/${tournament.id}`)}
        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 text-sm transition-colors duration-300"
      >
        View Full Details
      </button>
    </motion.div>
  );
};

export default MyTournamentCard;