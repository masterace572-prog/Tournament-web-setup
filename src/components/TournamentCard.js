// src/components/TournamentCard.js
'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';

// Helper function to format date and time
const formatDateTime = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return 'Date not set';
  const date = timestamp.toDate();
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

// Helper component for the live countdown
const CountdownTimer = ({ startTime }) => {
  const calculateTimeLeft = () => {
    if (!startTime || !startTime.toDate) return null;
    const diff = startTime.toDate().getTime() - new Date().getTime();
    if (diff <= 0) return null;

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Set a timer to update the countdown every second
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    // Clear the timer when the component unmounts to prevent memory leaks
    return () => clearTimeout(timer);
  });

  if (!timeLeft) {
    return (
        <div className="flex items-center space-x-2 text-yellow-500 dark:text-yellow-400">
            <FaClock />
            <span className="font-semibold">Starting soon...</span>
        </div>
    );
  }

  let timeString = "Starts in: ";
  if (timeLeft.days > 0) timeString += `${timeLeft.days}d `;
  if (timeLeft.hours > 0 || timeLeft.days > 0) timeString += `${timeLeft.hours}h `;
  if (timeLeft.minutes > 0 || timeLeft.hours > 0 || timeLeft.days > 0) timeString += `${timeLeft.minutes}m `;
  timeString += `${timeLeft.seconds}s`;

  return (
    <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
      <FaClock />
      <span className="font-semibold">{timeString}</span>
    </div>
  );
};

// Helper component for the status badge
const StatusBadge = ({ status }) => {
  const statusStyles = {
    Upcoming: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/50',
    Live: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50 animate-pulse',
    Completed: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/50',
    Cancelled: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/50',
  };
  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusStyles[status] || statusStyles.Completed}`}>
      {status}
    </span>
  );
};


// Main TournamentCard component
const TournamentCard = ({ tournament }) => {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/tournaments/${tournament.id}`);
  };

  // Variants for the staggered animation
  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden transition-all hover:border-purple-500/50 hover:shadow-purple-500/10 flex flex-col justify-between"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{tournament.title}</h3>
          <StatusBadge status={tournament.status} />
        </div>
        
        <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400 text-sm mb-4">
          <span className="flex items-center space-x-1"><FaMapMarkerAlt /> <span>{tournament.map}</span></span>
          <span className="flex items-center space-x-1"><FaUsers /> <span>{tournament.type}</span></span>
        </div>

        <div className="text-gray-700 dark:text-gray-300 text-sm mb-5 h-6 flex items-center">
          {tournament.status === 'Upcoming' && tournament.startTime ? (
            <CountdownTimer startTime={tournament.startTime} />
          ) : tournament.status === 'Live' ? (
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 animate-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="font-bold text-sm">MATCH IS LIVE!</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <FaCalendarAlt />
              <span>{formatDateTime(tournament.startTime)}</span>
            </div>
          )}
        </div>

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-4"></div>

        <div className="flex justify-between items-center text-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entry Fee</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">₹{tournament.entryFee}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prize Pool</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{tournament.prizePool}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Slots</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{tournament.slotsFilled} / {tournament.slotsTotal}</p>
          </div>
        </div>
      </div>
      
      <button 
        onClick={handleViewDetails}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 transition-colors duration-300"
      >
        View Details
      </button>
    </motion.div>
  );
};

export default TournamentCard;