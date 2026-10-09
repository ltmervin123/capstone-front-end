import React from 'react';
import { Coins, TrendingUp, Calculator, Fuel } from 'lucide-react';

interface PayrollKpiCardsProps {
  metrics: {
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    totalGasoline: number;
  };
  isEmployeeAccount: boolean;
}

export const PayrollKpiCards: React.FC<PayrollKpiCardsProps> = ({
  metrics,
  isEmployeeAccount,
}) => {
  const statCards = [
    {
      label: isEmployeeAccount ? 'My Take-Home Pay' : 'Total Net Distribution',
      subtitle: isEmployeeAccount
        ? 'Verified take-home salary'
        : 'Total payout across listed records',
      value: metrics.totalNet,
      icon: Coins,
      iconBg: 'bg-emerald-50 text-emerald-800',
    },
    {
      label: isEmployeeAccount ? 'My Gross Earnings' : 'Total Gross Earnings',
      subtitle: isEmployeeAccount
        ? 'Basic pay plus allowances'
        : 'Basic salaries, fuel, and allowances',
      value: metrics.totalGross,
      icon: TrendingUp,
      iconBg: 'bg-green-50 text-green-800',
    },
    {
      label: isEmployeeAccount ? 'My Total Deductions' : 'Total Deductions',
      subtitle: isEmployeeAccount
        ? 'SSS, PhilHealth, Pag-IBIG & tax'
        : 'Statutory shares, tardiness & advances',
      value: metrics.totalDeductions,
      icon: Calculator,
      iconBg: 'bg-rose-50 text-rose-700',
    },
    {
      label: isEmployeeAccount ? 'My Fuel Allowance' : 'Total Fuel Allowances',
      subtitle: isEmployeeAccount
        ? 'Travel & mobility subsidies'
        : 'Mobility allocations distributed',
      value: metrics.totalGasoline,
      icon: Fuel,
      iconBg: 'bg-amber-50 text-amber-900',
    },
  ];

  return (
    <section
      aria-label="Key payroll metrics"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {statCards.map((stat, i) => (
        <div
          key={i}
          className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col items-center justify-center text-center group transition-all"
        >
          <div
            className={`p-3 rounded-xl ${stat.iconBg} mb-3 group-hover:scale-105 transition-transform`}
          >
            <stat.icon size={22} />
          </div>
          <h2 className="text-3xl font-extrabold text-green-950 tracking-tight tabular-nums leading-none">
            ₱{stat.value.toLocaleString()}
          </h2>
          <p className="text-sm font-bold text-stone-800 mt-2">
            {stat.label}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">{stat.subtitle}</p>
        </div>
      ))}
    </section>
  );
};
