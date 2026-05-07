import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell,
  Wallet,
  PieChart,
  Link as LinkIcon,
  ChevronRight
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const Sidebar = ({ isOpen, toggleSidebar, role = 'admin' }) => {
  const menuItems = {
    admin: [
      { name: 'Overview', icon: LayoutDashboard, path: '/admin' },
      { name: 'Influencers', icon: Users, path: '/admin/influencers' },
      { name: 'Revenue', icon: PieChart, path: '/admin/revenue' },
      { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ],
    finance: [
      { name: 'Payouts', icon: DollarSign, path: '/finance' },
      { name: 'History', icon: Wallet, path: '/finance/history' },
      { name: 'Reports', icon: PieChart, path: '/finance/reports' },
    ],
    influencer: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/influencer' },
      { name: 'Earnings', icon: DollarSign, path: '/influencer/earnings' },
      { name: 'Referrals', icon: LinkIcon, path: '/influencer/referrals' },
    ]
  };

  const currentMenu = menuItems[role] || menuItems.admin;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -280,
          width: 280
        }}
        className={twMerge(
          "fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 lg:static",
          !isOpen && "lg:w-20"
        )}
      </motion.aside>
    </>
  );
};

// I'll rewrite this Sidebar more cleanly in a separate file.
// For now let's just create a robust Sidebar component.
export default Sidebar;
