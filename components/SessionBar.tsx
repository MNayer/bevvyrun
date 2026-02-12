import React, { useState } from 'react';
import { Link2, Users, Wifi, Copy, Check } from 'lucide-react';
import { Button } from './Button';

interface SessionBarProps {
  isHost: boolean;
  peerId: string | null;
  connectionCount: number;
}

export const SessionBar: React.FC<SessionBarProps> = ({ isHost, peerId, connectionCount }) => {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (!peerId) return;
    const url = `${window.location.origin}${window.location.pathname}?session=${peerId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-black text-white p-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-b-2 border-black sticky top-20 z-40 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Wifi className={`w-4 h-4 ${peerId ? 'text-[#4ade80]' : 'text-red-500 animate-pulse'}`} />
                <span className="font-bold uppercase tracking-widest text-sm">
                    {peerId ? (isHost ? "Session Live" : "Connected to Host") : "Connecting..."}
                </span>
            </div>
            {isHost && (
                <div className="flex items-center gap-2 bg-white/20 px-2 py-0.5 rounded-sm">
                    <Users className="w-4 h-4" />
                    <span className="font-mono font-bold text-sm">{connectionCount}</span>
                </div>
            )}
        </div>

        {isHost && peerId && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="hidden sm:inline text-xs text-gray-400 uppercase">Invite Colleagues:</span>
                <Button 
                    variant="ghost" 
                    onClick={copyLink}
                    className="flex-1 sm:flex-none border-white text-white hover:bg-white hover:text-black hover:border-white h-8 text-xs"
                >
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? "COPIED!" : "COPY LINK"}
                </Button>
            </div>
        )}
    </div>
  );
};