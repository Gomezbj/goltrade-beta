import React from 'react';
import { User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import UserPlusIcon from './icons/UserPlusIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import CodeBracketIcon from './icons/CodeBracketIcon';
import BuildingOffice2Icon from './icons/BuildingOffice2Icon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

interface AdminStatsProps {
  users: User[];
  currentUser: User | null;
}

interface StatCardProps {
    title: string;
    value: number | string;
    Icon: React.FC<{ className?: string }>;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, Icon, colorClass }) => (
    <div className="bg-secondary-800 p-5 rounded-xl shadow-lg flex items-center space-x-4 border-l-4 border-primary-500 transition-transform transform hover:scale-105">
        <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
            <p className="text-sm text-secondary-300 font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const AdminStats: React.FC<AdminStatsProps> = ({ users, currentUser }) => {
    const { t } = useTranslations();
    
    // The `users` prop is now pre-filtered by the parent `AdminDashboard` component.
    const totalClients = users.length;
    const demoClients = users.filter(u => u.accountType === 'demo').length;
    const paidClients = users.filter(u => u.accountType === 'pro').length;
    const enterpriseClients = users.filter(u => u.accountType === 'enterprise').length;
    
    // These stats might need the full user list if they are meant to be global.
    // For a sub-admin, we might want to show their own referral code count, which is 1 or 0.
    // Let's assume for now they are global stats, only shown to the main admin.
    const registeredReferralCodes = users.filter(u => u.ownReferralCode).length;
    const subAdminCreditConsumption = users
        .filter(u => u.role === 'sub-admin')
        .reduce((acc, user) => acc + (user.consumedCredits || 0), 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard 
                title={t('adminStatTotalClients')} 
                value={totalClients} 
                Icon={UserPlusIcon}
                colorClass="bg-blue-500"
            />
            <StatCard 
                title={t('adminStatDemoClients')} 
                value={demoClients} 
                Icon={AcademicCapIcon}
                colorClass="bg-yellow-500"
            />
            <StatCard 
                title={t('adminStatProClients')} 
                value={paidClients} 
                Icon={BanknotesIcon}
                colorClass="bg-green-500"
            />
             {currentUser?.role === 'admin' && (
                <>
                  <StatCard 
                      title={t('adminStatEnterpriseClients')} 
                      value={enterpriseClients} 
                      Icon={BuildingOffice2Icon}
                      colorClass="bg-indigo-500"
                  />
                  <StatCard 
                      title={t('adminStatSubAdminCredits')} 
                      value={subAdminCreditConsumption} 
                      Icon={ShieldCheckIcon}
                      colorClass="bg-cyan-500"
                  />
                  <StatCard 
                      title={t('adminStatReferralCodes')} 
                      value={registeredReferralCodes} 
                      Icon={CodeBracketIcon}
                      colorClass="bg-purple-500"
                  />
                </>
            )}
        </div>
    );
};

export default AdminStats;