'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { sendCaseMessage, listCaseMessages, type CaseMessageDTO } from '@/lib/actions/messages';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CaseMessagesPanelProps {
  caseId: string;
  initialMessages: CaseMessageDTO[];
  currentProfileId: string;
  allowSend?: boolean;
}

export function CaseMessagesPanel({ caseId, initialMessages, currentProfileId, allowSend = true }: CaseMessagesPanelProps) {
  const [messages, setMessages] = useState<CaseMessageDTO[]>(initialMessages);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, caseId]);

  useEffect(() => {
    if (initialMessages.length === 0) {
      refreshMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const groupedMessages = useMemo(() => messages.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), [messages]);

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: 'Mensaje vacío',
        description: 'Escribe un mensaje antes de enviarlo.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        const newMessage = await sendCaseMessage({
          caseId,
          contenido: message.trim(),
        });
        setMessages((prev) => [...prev, newMessage]);
        setMessage('');
      } catch (error: any) {
        toast({
          title: 'No se pudo enviar',
          description: error?.message ?? 'Intenta nuevamente en unos minutos.',
          variant: 'destructive',
        });
      }
    });
  };

  const refreshMessages = async () => {
    setRefreshing(true);
    try {
      const refreshed = await listCaseMessages(caseId, { limit: 100 });
      setMessages(refreshed);
    } catch (error: any) {
      toast({
        title: 'Error al actualizar',
        description: error?.message ?? 'No fue posible obtener los mensajes.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className='space-y-6 text-white/80'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-white'>Mensajes del caso</h3>
        <Button variant='outline' size='sm' onClick={refreshMessages} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Actualizar'}
        </Button>
      </div>

      <div className='space-y-4'>
        {groupedMessages.length === 0 ? (
          <p className='text-sm text-white/60'>Aún no hay mensajes para este caso.</p>
        ) : (
          groupedMessages.map((msg) => {
            const isMine = msg.sender_profile_id === currentProfileId;
            return (
              <Card
                key={msg.id}
                className={`panel-compact panel-no-accent border ${isMine ? 'border-cyan-300/50 bg-cyan-300/12' : 'border-white/12 bg-white/6'}`}
              >
                <CardContent className='space-y-2 p-4 text-white/75'>
                  <div className='flex items-center justify-between text-xs text-white/60'>
                    <span>
                      {msg.sender?.nombre ?? 'Usuario'}
                      {msg.sender?.role && (
                        <Badge variant='outline' className='ml-2 capitalize text-[10px] text-white/70'>
                          {msg.sender.role}
                        </Badge>
                      )}
                    </span>
                    <span>{formatDateTime(msg.created_at)}</span>
                  </div>
                  <p className='whitespace-pre-wrap text-sm text-white/85'>{msg.contenido}</p>
                  {msg.attachment_url && (
                    <a
                      href={msg.attachment_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-xs font-medium text-cyan-200 hover:text-white'
                    >
                      Ver adjunto
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {allowSend && (
        <div className='space-y-3 border border-white/15 bg-white/6 p-4'>
          <Textarea
            placeholder='Escribe un mensaje para tu cliente o equipo...'
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={isPending}
            className='min-h-[120px]'
          />
          <div className='flex items-center justify-end'>
            <Button onClick={handleSend} disabled={isPending}>
              {isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Send className='mr-2 h-4 w-4' />}
              Enviar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
