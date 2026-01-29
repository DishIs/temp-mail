"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Lock, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { UpsellModal } from "@/components/upsell-modal";
import { useTranslations } from "next-intl";

interface MuteListManagerProps {
    initialSenders: string[];
    isPro: boolean;
}

export function MuteListManager({ initialSenders, isPro }: MuteListManagerProps) {
    const t = useTranslations('Dashboard');
    const {data: session} = useSession();
    const user = session?.user;
    const [mutedSenders, setMutedSenders] = useState<string[]>(initialSenders || []);
    const [newSender, setNewSender] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Upsell State
    const [isUpsellOpen, setIsUpsellOpen] = useState(false);
    
    const handleMuteSender = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isPro) {
            setIsUpsellOpen(true);
            return;
        }

        if (!newSender || !user) return;
        setIsLoading(true);
        const toastId = toast.loading(`${t('mute_btn')} ${newSender}...`);

        try {
            const response = await fetch('/api/user/mute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderToMute: newSender, wyiUserId: user.id }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to mute sender.');

            setMutedSenders([...mutedSenders, newSender]);
            setNewSender("");
            toast.success(t('mute_success'), { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUnmuteSender = async (senderToUnmute: string) => {
        if (!isPro) {
            setIsUpsellOpen(true);
            return;
        }

        if (!user) return;
        setIsLoading(true);
        const toastId = toast.loading(`Un-muting ${senderToUnmute}...`);

        try {
            const response = await fetch('/api/user/mute', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderToUnmute, wyiUserId: user.id }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to un-mute sender.');

            setMutedSenders(mutedSenders.filter(s => s !== senderToUnmute));
            toast.success(t('unmute_success'), { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2">
                            {t('mute_title')}
                            {!isPro && <Lock className="h-4 w-4 text-muted-foreground" />}
                        </CardTitle>
                        <CardDescription>{t('mute_desc')}</CardDescription>
                    </div>
                    {!isPro && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            <Crown className="w-3 h-3 mr-1" /> {t('domains_pro_badge')}
                        </Badge>
                    )}
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleMuteSender} className="flex gap-2 mb-4">
                        <Input
                            placeholder={t('mute_placeholder')}
                            value={newSender}
                            onChange={(e) => setNewSender(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !newSender}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('mute_btn')}
                        </Button>
                    </form>
                    <div className="rounded-md border p-4 min-h-[10rem] bg-muted/20">
                        {mutedSenders.length > 0 ? (
                            <ul className="space-y-2">
                            {mutedSenders.map((sender) => (
                                <li key={sender} className="flex justify-between items-center bg-background border p-2 rounded">
                                    <span className="text-sm font-mono">{sender}</span>
                                    <Button variant="ghost" size="icon" onClick={() => handleUnmuteSender(sender)} disabled={isLoading}>
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </li>
                            ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                                <p>{t('mute_empty')}</p>
                                {!isPro && <p className="text-xs mt-1 text-center">{t('mute_empty_upsell')}</p>}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <UpsellModal 
                isOpen={isUpsellOpen} 
                onClose={() => setIsUpsellOpen(false)} 
                featureName="Mute Senders" 
            />
        </>
    );
}