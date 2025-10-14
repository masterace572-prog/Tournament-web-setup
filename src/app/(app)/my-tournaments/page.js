// src/app/(app)/my-tournaments/page.js
'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, onSnapshot, query, where, getDoc, doc } from "firebase/firestore";
import MyTournamentCard from "@/components/MyTournamentCard";
import { motion } from "framer-motion";

export default function MyTournamentsPage() {
    const { currentUser } = useAuth();
    const [myTournaments, setMyTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Upcoming');

    useEffect(() => {
        if (!currentUser) return;

        setLoading(true);

        // This listener watches all tournaments and checks for the user's participation.
        const tournamentsQuery = query(collection(db, "tournaments"));

        const unsubscribe = onSnapshot(tournamentsQuery, async (tournamentsSnapshot) => {
            const userTournaments = [];
            
            // Use Promise.all to fetch participant data concurrently for better performance
            const participantChecks = tournamentsSnapshot.docs.map(async (tournamentDoc) => {
                const tournamentData = { id: tournamentDoc.id, ...tournamentDoc.data() };
                
                // For each tournament, check if the current user is a participant
                const participantRef = doc(db, `tournaments/${tournamentData.id}/participants`, currentUser.uid);
                const participantSnap = await getDoc(participantRef);

                if (participantSnap.exists()) {
                    // If they are a participant and the status matches the current filter, add it to the list
                    if (tournamentData.status === filter) {
                        return {
                            ...tournamentData,
                            participantData: participantSnap.data(), // Attach the specific participant data
                        };
                    }
                }
                return null; // Return null if not a participant or status doesn't match
            });

            // Wait for all the checks to complete
            const results = await Promise.all(participantChecks);
            const filteredTournaments = results.filter(t => t !== null); // Filter out the null results
            
            // Sort by start time for consistency
            filteredTournaments.sort((a, b) => a.startTime.seconds - b.startTime.seconds);

            setMyTournaments(filteredTournaments);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching my tournaments: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, filter]); // Re-run effect when user logs in or filter changes

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
    };
      
    const filterButtons = ['Upcoming', 'Live', 'Completed'];

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-white"
                >
                    My Tournaments
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-400 mt-2"
                >
                    Here are all the battles you've joined. Good luck!
                </motion.p>

                {/* Filter Tabs */}
                <div className="my-6 flex space-x-2 border-b border-gray-700">
                    {filterButtons.map(buttonFilter => (
                        <button
                            key={buttonFilter}
                            onClick={() => setFilter(buttonFilter)}
                            className={`px-4 py-2 text-sm font-semibold transition-colors
                                ${filter === buttonFilter 
                                ? 'border-b-2 border-purple-500 text-white' 
                                : 'text-gray-400 hover:text-white'
                                }`
                            }
                        >
                        {buttonFilter}
                        </button>
                    ))}
                </div>

                {/* Tournaments Grid */}
                {loading ? (
                    <p className="text-center text-gray-400 mt-10">Loading your tournaments...</p>
                ) : myTournaments.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10 bg-gray-800/50 p-8 rounded-lg">
                        <p className="font-bold text-lg">No {filter.toLowerCase()} tournaments found.</p>
                        <p className="text-sm mt-2">Why not join one from the Home page?</p>
                    </div>
                ) : (
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {myTournaments.map(tournament => (
                            <MyTournamentCard 
                                key={tournament.id} 
                                tournament={tournament} 
                                participantData={tournament.participantData}
                            />
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}