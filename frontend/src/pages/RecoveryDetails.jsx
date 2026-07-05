import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import recoveryService from '../services/recoveryService';
import chatService from '../services/chatService';
import socketService from '../services/socketService';
import useAuth from '../hooks/useAuth';
import CampusMap from '../components/CampusMap';
import { generateGoogleNavigation } from '../utils/mapUtils';

const STATUS_STEPS = ['Active', 'Contact Requested', 'Contact Accepted', 'Verification Pending', 'Recovered'];

const statusColor = (s) => {
  if (s === 'Recovered') return 'text-emerald-400';
  if (s === 'Closed') return 'text-zinc-500';
  return 'text-amber-400';
};

export default function RecoveryDetails() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [session, setSession] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [meetingLocation, setMeetingLocation] = useState(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationSent, setLocationSent] = useState(false);

  // Verification state
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [verifying, setVerifying] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const isOwner = session && user && session.owner?._id === user.id;
  const isFinder = session && user && session.finder?._id === user.id;
  const custodyType = match?.foundItem?.custodyType;
  const chatEnabled = session && ['Contact Accepted', 'Verification Pending', 'Recovered'].includes(session.status);

  // Load session
  useEffect(() => {
    const load = async () => {
      try {
        const sessionRes = await recoveryService.getSession(matchId);
        const sessionData = sessionRes.data;
        setSession(sessionData);
        // Initialize meeting location from session
        if (sessionData.meetingLocation) {
          setMeetingLocation(sessionData.meetingLocation);
        }
      } catch {
        // Session doesn't exist yet
      }
      try {
        const { getMatchDetails } = await import('../services/matchService');
        const matchData = await getMatchDetails(matchId);
        setMatch(matchData);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [matchId]);

  // Chat messages + socket
  useEffect(() => {
    if (!chatEnabled || !session) return;

    const loadMessages = async () => {
      try {
        const res = await chatService.getMessages(session._id);
        setMessages(res.data);
      } catch (e) { console.error(e); }
    };
    loadMessages();

    socketService.connect(token, session._id);
    socketService.onReceiveMessage((msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    // Listen for live meeting location updates
    socketService.on('meeting-location:updated', (data) => {
      setMeetingLocation(data.meetingLocation);
    });

    return () => {
      socketService.offReceiveMessage();
      socketService.off('meeting-location:updated');
      socketService.disconnect();
    };
  }, [chatEnabled, session, token]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartRecovery = async () => {
    setStarting(true);
    setError('');
    try {
      const res = await recoveryService.startRecovery(matchId);
      setSession(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to start recovery.');
    } finally {
      setStarting(false);
    }
  };

  const handleAcceptContact = async () => {
    try {
      const res = await recoveryService.acceptContact(session._id);
      setSession(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to accept contact.');
    }
  };

  const handleLoadVerificationQuestions = async () => {
    try {
      const res = await recoveryService.getVerificationQuestions(session._id);
      setQuestions(res.data);
    } catch (e) { setError('Failed to load questions.'); }
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await recoveryService.submitVerification(session._id, answers);
      setSession(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit verification.');
    } finally {
      setVerifying(false);
    }
  };

  const handleApproveVerification = async () => {
    try {
      const res = await recoveryService.approveVerification(session._id);
      setSession(res.data);
    } catch (e) { setError('Failed to approve verification.'); }
  };

  const handleCompleteRecovery = async () => {
    try {
      const res = await recoveryService.completeRecovery(session._id);
      setSession(res.data);
      setError('');
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Failed to complete recovery.');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const receiverId = isOwner ? session.finder?._id : session.owner?._id;
    socketService.sendMessage(receiverId, newMessage.trim());
    setNewMessage('');
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20 text-zinc-400">Loading recovery details...</div>
    </DashboardLayout>
  );

  const currentStatusIndex = STATUS_STEPS.indexOf(session?.status);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-10 px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(`/dashboard/matches/${matchId}`)} className="text-zinc-400 hover:text-white text-sm font-medium flex items-center gap-2">
            ← Back to Match Details
          </button>
          {session && (
            <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${statusColor(session.status)} border-current bg-current/10`}>
              {session.status}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white">Recovery Details</h1>

        {error && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        {/* START RECOVERY — no session yet */}
        {!session && (
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-8 h-8 text-emerald-400">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                <path d="M10 8l6 4-6 4V8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-lg">Ready to Recover?</h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">This will initiate the recovery process. Based on the custody type, you will be guided through the appropriate steps.</p>
            <button
              id="confirm-start-recovery-btn"
              onClick={handleStartRecovery}
              disabled={starting}
              className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {starting ? 'Starting...' : 'Confirm — Start Recovery'}
            </button>
          </div>
        )}

        {session && (
          <>
            {/* Progress Bar */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Recovery Progress</h2>
              <div className="flex items-center gap-0">
                {STATUS_STEPS.map((step, idx) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${idx <= currentStatusIndex ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-transparent border-white/20 text-zinc-600'}`}>
                        {idx < currentStatusIndex ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[10px] mt-1 text-center max-w-[60px] leading-tight ${idx <= currentStatusIndex ? 'text-emerald-400' : 'text-zinc-600'}`}>{step}</span>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mb-4 transition-all duration-500 ${idx < currentStatusIndex ? 'bg-emerald-500' : 'bg-white/10'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* DEPOSITED FLOW */}
            {custodyType === 'deposited' && (
              <div className="bg-[#141414] border border-emerald-500/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center">📍</span>
                    Item Deposited — Pickup Location
                  </h2>
                  {match?.foundItem?.location?.latitude && match?.foundItem?.location?.longitude && (
                    <a
                      href={generateGoogleNavigation(match.foundItem.location.latitude, match.foundItem.location.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-white/10 hover:bg-white text-white hover:text-black px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      🗺️ Navigate
                    </a>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Campus Zone</p>
                    <p className="text-white font-medium">{match?.foundItem?.location?.campusZone || match?.foundItem?.currentLocation || '—'}</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Landmark</p>
                    <p className="text-white font-medium">{match?.foundItem?.location?.landmark || match?.foundItem?.landmark || '—'}</p>
                  </div>
                </div>
                {match?.foundItem?.location?.latitude && match?.foundItem?.location?.longitude ? (
                  <div className="h-[280px] w-full">
                    <CampusMap mode="view" value={match.foundItem.location} />
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">
                    📍 {match?.foundItem?.location?.campusZone || 'Campus Location'} — Please visit this location to collect your item.
                  </p>
                )}
                <p className="text-sm text-zinc-400">Please bring your ID card for verification when collecting the item.</p>
                {session.status !== 'Recovered' && isOwner && (
                  <button id="mark-recovered-deposited-btn" onClick={handleCompleteRecovery} className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all">
                    Mark as Recovered
                  </button>
                )}
              </div>
            )}

            {/* HOLDING FLOW — Finder sets meeting point */}
            {custodyType === 'holding' && chatEnabled && isFinder && (
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
                <h2 className="text-white font-semibold">📍 Set Meeting Location</h2>
                <p className="text-sm text-zinc-400">Drop a pin on the map to set the meeting point. The owner will see it update in real time.</p>
                <div className="h-[280px] w-full">
                  <CampusMap
                    mode="select"
                    value={meetingLocation}
                    onLocationChange={(loc) => setMeetingLocation(loc)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (!meetingLocation?.latitude || !meetingLocation?.longitude) {
                        setError('Please drop a pin on the map first.');
                        return;
                      }
                      setSavingLocation(true);
                      setLocationSent(false);
                      socketService.emit('meeting-location:set', {
                        latitude: meetingLocation.latitude,
                        longitude: meetingLocation.longitude,
                        selectedBy: meetingLocation.selectedBy || 'MAP'
                      });
                      // Optimistic feedback — confirmed by server broadcast
                      setTimeout(() => {
                        setSavingLocation(false);
                        setLocationSent(true);
                        setTimeout(() => setLocationSent(false), 3000);
                      }, 800);
                    }}
                    disabled={!meetingLocation?.latitude || savingLocation}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black font-medium text-sm transition-all disabled:opacity-40"
                  >
                    {savingLocation ? 'Sending...' : 'Set Meeting Point'}
                  </button>
                  {locationSent && (
                    <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                      ✓ Location shared with owner
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* HOLDING FLOW — Owner sees live meeting location */}
            {custodyType === 'holding' && chatEnabled && isOwner && meetingLocation && (
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-semibold">📍 Meeting Location</h2>
                  {meetingLocation.latitude && meetingLocation.longitude && (
                    <a
                      href={generateGoogleNavigation(meetingLocation.latitude, meetingLocation.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-white/10 hover:bg-white text-white hover:text-black px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      🗺️ Navigate
                    </a>
                  )}
                </div>
                <div className="flex gap-4">
                  {meetingLocation.campusZone && (
                    <div className="bg-black/30 rounded-xl p-4 flex-1">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Zone</p>
                      <p className="text-white font-medium">{meetingLocation.campusZone}</p>
                    </div>
                  )}
                  {meetingLocation.landmark && (
                    <div className="bg-black/30 rounded-xl p-4 flex-1">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Landmark</p>
                      <p className="text-white font-medium">{meetingLocation.landmark}</p>
                    </div>
                  )}
                </div>
                <div className="h-[280px] w-full">
                  <CampusMap mode="view" value={meetingLocation} />
                </div>
                <p className="text-xs text-zinc-500">This location updates live when the finder moves the pin.</p>
              </div>
            )}
            {/* HOLDING FLOW — contact request for finder */}
            {custodyType === 'holding' && session.status === 'Contact Requested' && isFinder && (
              <div className="bg-[#141414] border border-amber-500/20 rounded-2xl p-6 space-y-4">
                <h2 className="text-white font-semibold">📨 Contact Request Received</h2>
                <p className="text-sm text-zinc-400">The owner wants to get in touch with you regarding this found item. Do you want to accept and open a private chat?</p>
                <div className="flex gap-3">
                  <button id="accept-contact-btn" onClick={handleAcceptContact} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all">Accept</button>
                </div>
              </div>
            )}

            {/* HOLDING FLOW — waiting for finder */}
            {custodyType === 'holding' && session.status === 'Contact Requested' && isOwner && (
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 text-center space-y-2">
                <div className="text-2xl">⏳</div>
                <p className="text-white font-medium">Waiting for Finder</p>
                <p className="text-sm text-zinc-400">Your contact request has been sent. The finder will respond soon.</p>
              </div>
            )}

            {/* VERIFICATION — Owner submits */}
            {session.status === 'Contact Accepted' && isOwner && (
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
                <h2 className="text-white font-semibold">✅ Ownership Verification</h2>
                <p className="text-sm text-zinc-400">Answer the questions below to prove ownership of this item.</p>
                {questions.length === 0 ? (
                  <button id="load-questions-btn" onClick={handleLoadVerificationQuestions} className="px-5 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white text-sm hover:bg-white/12 transition-all">Load Verification Questions</button>
                ) : (
                  <form onSubmit={handleSubmitVerification} className="space-y-4">
                    {questions.map((q) => (
                      <div key={q.key}>
                        <label className="block text-sm text-zinc-300 mb-1.5">{q.question}</label>
                        <input
                          type="text"
                          required
                          value={answers[q.key] || ''}
                          onChange={(e) => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                          placeholder="Your answer..."
                        />
                      </div>
                    ))}
                    <button id="submit-verification-btn" type="submit" disabled={verifying} className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all disabled:opacity-50">
                      {verifying ? 'Submitting...' : 'Submit Answers'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* VERIFICATION — Finder reviews */}
            {session.status === 'Verification Pending' && session.verification?.status !== 'Approved' && isFinder && (
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
                <h2 className="text-white font-semibold">🔍 Review Verification Answers</h2>
                <div className="space-y-3">
                  {session.verification?.questions?.map((q) => (
                    <div key={q.key} className="bg-black/30 rounded-xl p-4">
                      <p className="text-xs text-zinc-500 mb-1">{q.question}</p>
                      <p className="text-white font-medium">{session.verification.answers?.[q.key] || '—'}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button id="approve-verification-btn" onClick={handleApproveVerification} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all">Approve</button>
                </div>
              </div>
            )}

            {/* Mark Recovered — after verification approved */}
            {session.status === 'Verification Pending' && session.verification?.status === 'Approved' && isOwner && (
              <div className="bg-[#141414] border border-emerald-500/20 rounded-2xl p-6 text-center space-y-3">
                <p className="text-emerald-400 font-semibold">✅ Verification Approved!</p>
                <button id="mark-recovered-btn" onClick={handleCompleteRecovery} className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all">Mark as Recovered</button>
              </div>
            )}

            {/* Recovered State */}
            {session.status === 'Recovered' && (
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-2">
                <div className="text-4xl">🎉</div>
                <h2 className="text-emerald-400 font-bold text-lg">Item Successfully Recovered!</h2>
                <p className="text-sm text-zinc-400">This recovery session has been completed. The item has been returned to its rightful owner.</p>
              </div>
            )}

            {/* CHAT — Only when enabled */}
            {chatEnabled && custodyType === 'holding' && (
              <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-white font-semibold">Private Chat</h2>
                  <span className="text-xs text-zinc-500 ml-auto">Secure · End-to-end private</span>
                </div>

                {/* Messages */}
                <div id="chat-messages-container" className="h-72 overflow-y-auto px-6 py-4 space-y-3 bg-black/20">
                  {messages.map((msg, i) => {
                    if (msg.messageType === 'system') {
                      return (
                        <div key={i} className="flex justify-center">
                          <span className="text-xs text-zinc-500 bg-white/5 rounded-full px-3 py-1">{msg.content}</span>
                        </div>
                      );
                    }
                    const mine = msg.sender?.toString() === user?.id?.toString();
                    return (
                      <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${mine ? 'bg-emerald-500 font-medium rounded-br-sm' : 'bg-white/8 border border-white/10 text-zinc-200 rounded-bl-sm'}`} style={mine ? {color: '#000000'} : {}}>
                          <p style={mine ? {color: '#000000'} : {}}>{msg.content}</p>
                          <p className={`text-[10px] mt-1 font-medium ${!mine && 'text-zinc-600'}`} style={mine ? {color: '#000000'} : {}}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="px-4 py-4 border-t border-white/10 flex gap-3">
                  <input
                    id="chat-message-input"
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors placeholder:text-zinc-600"
                  />
                  <button id="send-message-btn" type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all">Send</button>
                </form>
              </div>
            )}

            {/* Chat locked state */}
            {!chatEnabled && custodyType === 'holding' && (
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-zinc-600 text-lg flex-shrink-0">🔒</div>
                <div>
                  <p className="text-white font-medium text-sm">Chat Locked</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Chat becomes available after the finder accepts your contact request.</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-5">Recovery Timeline</h2>
              {session.timeline?.length === 0 ? (
                <p className="text-sm text-zinc-600">No timeline events yet.</p>
              ) : (
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2.5 top-0 bottom-0 w-px bg-white/8" />
                  {session.timeline?.map((event, i) => (
                    <div key={i} className="relative flex items-start gap-4">
                      <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#141414]" />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{event.event}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {new Date(event.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
