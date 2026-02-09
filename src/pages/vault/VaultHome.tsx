import React, { useState } from 'react';
import { Plus, Search, LogOut, Key, ShieldCheck, Settings, Copy } from 'lucide-react';
import { Button, Input, Card, cn } from '../../components/ui';
import { useVaultStore } from '../../store/vaultStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import type { Credential } from '../../utils/types';

const VaultHome = () => {
    const navigate = useNavigate();
    const { credentials, syncStatus } = useVaultStore();
    const logout = useAuthStore((state) => state.logout);
    const [search, setSearch] = useState('');

    const filteredCredentials = credentials.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.username.toLowerCase().includes(search.toLowerCase()) ||
        c.url.toLowerCase().includes(search.toLowerCase())
    );

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        // In a real app, show a toast here
        console.log(`${label} copied!`);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b bg-card sticky top-0 z-10 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="bg-primary/10 p-1.5 rounded-md">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <h1 className="font-bold text-lg">ZeroVault</h1>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/generator')} className="h-8 w-8">
                            <Key className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-destructive">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search vault..."
                        className="pl-9 h-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredCredentials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                        <div className="bg-muted p-6 rounded-full">
                            <Search className="w-10 h-10 text-muted-foreground opacity-20" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">No results found</p>
                            <p className="text-xs text-muted-foreground">Add your first item to get started</p>
                        </div>
                        <Button onClick={() => navigate('/add-credential')}>
                            <Plus className="w-4 h-4 mr-2" /> Add Item
                        </Button>
                    </div>
                ) : (
                    filteredCredentials.map((item) => (
                        <CredentialItem key={item.id} item={item} onCopy={handleCopy} onEdit={() => navigate(`/edit-credential/${item.id}`)} />
                    ))
                )}
            </div>

            {/* Footer Navigation */}
            <div className="border-t bg-card p-2 flex justify-around">
                <NavButton active icon={<ShieldCheck className="w-5 h-5" />} label="Vault" onClick={() => navigate('/vault')} />
                <NavButton icon={<Plus className="w-5 h-5" />} label="Add" onClick={() => navigate('/add-credential')} />
                <NavButton icon={<Key className="w-5 h-5" />} label="Generator" onClick={() => navigate('/generator')} />
                <NavButton icon={<Settings className="w-5 h-5" />} label="Settings" onClick={() => navigate('/settings')} />
            </div>
        </div>
    );
};

const CredentialItem = ({ item, onCopy, onEdit }: { item: Credential, onCopy: (text: string, label: string) => void, onEdit: () => void }) => (
    <Card className="p-3 hover:bg-accent/50 transition-colors cursor-pointer group" onClick={onEdit}>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">{item.name[0].toUpperCase()}</span>
                </div>
                <div className="overflow-hidden">
                    <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{item.username}</p>
                </div>
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); onCopy(item.password, 'Password'); }}
                >
                    <Key className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); onCopy(item.username, 'Username'); }}
                >
                    <Copy className="w-4 h-4" />
                </Button>
            </div>
        </div>
    </Card>
);

const NavButton = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex flex-col items-center p-2 rounded-lg transition-colors min-w-[64px]",
            active ? "text-primary bg-primary/5" : "text-muted-foreground hover:bg-accent"
        )}
    >
        {icon}
        <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
);

export default VaultHome;
