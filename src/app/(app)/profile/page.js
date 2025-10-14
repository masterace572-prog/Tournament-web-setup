// src/app/(app)/profile/page.js
'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collectionGroup, query, where, getDocs, onSnapshot, doc } from "firebase/firestore";
import { motion } from "framer-motion";
import { FaUserEdit, FaShieldAlt } from "react-icons/fa";
import EditProfileModal from "@/components/EditProfileModal"; // ⭐️ IMPORT THE MODAL

// StatCard component is unchanged
const StatCard = ({ label, value, color }) => (
    <div className="bg-gray-800/50 p-4 rounded-lg text-center border border-gray-700">
        <p className={`text-3xl font-bold ${color || 'text-white'}`}>{value}</p>
        <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
);


export default function ProfilePage() {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState({ totalMatches: 0, totalKills: 0, totalWinnings: 0, wins: 0 });
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // ⭐️ STATE FOR MODAL

    // Listener for real-time user data updates
    useEffect(() => {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                // We need the document ID for the update logic, so let's add it here.
                setUserData({ userID: docSnap.id, ...docSnap.data() });
            }
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Effect to calculate lifetime statistics
    useEffect(() => {
        if (!currentUser) return;

        const calculateStats = async () => {
            setLoading(true);
            const q = query(
                collectionGroup(db, "participants"),
                where("participantID", "==", currentUser.uid)
            );

            const participantDocs = await getDocs(q);
            
            let totalMatches = 0, totalKills = 0, totalWinnings = 0, wins = 0;
            participantDocs.forEach(doc => {
                const data = doc.data();
                totalMatches++;
                totalKills += data.kills || 0;
                totalWinnings += data.winnings || 0;
                if (data.rank === 1) wins++;
            });

            setStats({ totalMatches, totalKills, totalWinnings, wins });
            setLoading(false);
        };

        calculateStats();
    }, [currentUser]);

    const winPercentage = stats.totalMatches > 0 ? ((stats.wins / stats.totalMatches) * 100).toFixed(1) : 0;

    if (loading || !userData) {
        return <div className="text-center p-10 text-gray-400">Loading Profile...</div>;
    }

    return (
        <>
            {/* The Modal is here, but hidden until toggled */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentUserData={userData}
            />

            <div className="p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Profile Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row items-center bg-gray-800/50 p-6 rounded-lg border border-gray-700"
                    >
                        <img
                            src={userData.profilePicUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userData.username}`}
                            alt="Profile Picture"
                            className="w-24 h-24 rounded-full border-4 border-purple-500"
                        />
                        <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-white">{userData.username}</h1>
                            <p className="text-gray-400">{userData.email}</p>
                            <p className="text-sm text-purple-300 mt-1">In-Game Name: {userData.inGameName || 'Not Set'}</p>
                        </div>
                        <div className="md:ml-auto mt-4 md:mt-0 flex space-x-2">
                             <button 
                                onClick={() => setIsEditModalOpen(true)} // ⭐️ ONCLICK HANDLER
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-sm font-semibold rounded-lg flex items-center space-x-2"
                            >
                                <FaUserEdit />
                                <span>Edit Profile</span>
                            </button>
                             {userData.role === 'Admin' && (
                                 <span className="px-4 py-2 bg-yellow-500 text-black text-sm font-bold rounded-lg flex items-center space-x-2">
                                    <FaShieldAlt />
                                    <span>Admin</span>
                                 </span>
                             )}
                        </div>
                    </motion.div>

                    {/* Statistics Grid */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">Lifetime Statistics</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Matches Played" value={stats.totalMatches} />
                            <StatCard label="Total Kills" value={stats.totalKills} />
                            <StatCard label="Total Winnings" value={`₹${stats.totalWinnings.toFixed(0)}`} color="text-green-400" />
                            <StatCard label="Win Rate" value={`${winPercentage}%`} color="text-purple-400" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}