import { useState, useMemo, useCallback } from 'react';
import { storageService } from '../../../../services/storageService';

export function useAuditTrail() {
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterUser, setLogFilterUser] = useState('All');

  const allLogs = useMemo(() => storageService.getLogs(), []);

  const logInitiators = useMemo(() => {
    return Array.from(new Set(allLogs.map((l) => l.username)));
  }, [allLogs]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const matchesSearch =
        log.username.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(logSearchQuery.toLowerCase());
      const matchesUser =
        logFilterUser === 'All' || log.username === logFilterUser;
      return matchesSearch && matchesUser;
    });
  }, [allLogs, logFilterUser, logSearchQuery]);

  const handleExportLogs = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(allLogs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute(
      'download',
      `system_audit_logs_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [allLogs]);

  return {
    allLogs,
    logInitiators,
    logSearchQuery,
    setLogSearchQuery,
    logFilterUser,
    setLogFilterUser,
    filteredLogs,
    handleExportLogs,
  };
}
