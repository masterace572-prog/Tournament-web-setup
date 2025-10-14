// src/app/(app)/dashboard/page.js
'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import TournamentCard from "@/components/TournamentCard";
import { motion } from "framer-motion";

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Upcoming');

    useEffect(() => {
        setLoading(true);
        const q = query(
          collection(db, "tournaments"),
          where("status", "==", filter),
          where("isApproved", "==", true)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const tournamentsData = [];
          querySnapshot.forEach((doc) => {
            tournamentsData.push({ id: doc.id, ...doc.data() });
          });
          
          // Sort tournaments by their start time
          tournamentsData.sort((a, b) => {
              if (a.startTime && b.startTime) {
                  // For Completed, show newest first. For others, show oldest first.
                  return filter === 'Completed'
                    ? b.startTime.seconds - a.startTime.seconds
                    : a.startTime.seconds - b.startTime.seconds;
              }
              return 0;
          });

          setTournaments(tournamentsData);
          setLoading(false);
          console.log(`Loaded ${tournamentsData.length} ${filter} tournaments.`);
        }, (error) => {
          console.error("Error fetching tournaments: ", error);
          setLoading(false);
        });

        return () => unsubscribe();
    }, [filter]);

    // Animation variants for the container to stagger children
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1 // Each child card animates 0.1s after the previous
          }
        }
    };
      
    const filterButtons = ['Upcoming', 'Live', 'Completed'];

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-white dark:text-white">Tournaments</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Welcome, {currentUser?.email || 'Player'}! Ready to compete?
                </p>

                {/* Filter Tabs */}
                <div className="my-6 flex space-x-2 border-b border-gray-200 dark:border-gray-700">
                    {filterButtons.map(buttonFilter => (
                        <button
                            key={buttonFilter}
                            onClick={() => setFilter(buttonFilter)}
                            className={`px-4 py-2 text-sm font-semibold transition-colors focus:outline-none
                                ${filter === buttonFilter 
                                  ? 'border-b-2 border-purple-500 text-gray-900 dark:text-white' 
                                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`
                            }
                        >
                            {buttonFilter}
                        </button>
                    ))}
                </div>

                {/* Tournaments Grid */}
                {loading ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 mt-10">Loading Tournaments...</p>
                ) : tournaments.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 mt-10">No {filter} tournaments found.</p>
                ) : (
                    <motion.div 
                        key={filter} // Add key to re-trigger animation on filter change
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {tournaments.map(tournament => (
                            <TournamentCard key={tournament.id} tournament={tournament} />
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}