import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Key, Mail, Bell } from 'lucide-react';

declare global {
  interface Window {
    OneSignal: any;
  }
}

export default function OneSignalPlayerGenerator() {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
  const [email, setEmail] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notifications, setNotifications] = useState<Array<{time: string, title: string, message: string}>>([]);

  useEffect(() => {
    // Load OneSignal SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onload = () => {
      setSdkLoaded(true);
      console.log('✅ OneSignal SDK loaded');
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const setupNotificationListener = () => {
    if (window.OneSignal) {
      // Listen for notifications
      window.OneSignal.Notifications.addEventListener('click', (event: any) => {
        console.log('Notification clicked:', event);
      });

      window.OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
        console.log('Notification received in foreground:', event);
        
        const notification = event.notification;
        const newNotification = {
          time: new Date().toLocaleTimeString(),
          title: notification.title || 'New Notification',
          message: notification.body || 'No message'
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setSuccess(`New notification received: ${notification.title}`);
      });
    }
  };

  const handleRegister = async () => {
    setError('');
    setSuccess('');

    if (!appId || appId === 'your-app-id-here') {
      setError('Please configure VITE_ONESIGNAL_APP_ID in your .env file');
      return;
    }

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!sdkLoaded) {
      setError('OneSignal SDK is still loading. Please wait...');
      return;
    }

    setLoading(true);

    try {
      // Initialize OneSignal
      await window.OneSignal.init({
        appId: appId,
        allowLocalhostAsSecureOrigin: true,
      });

      console.log('✅ OneSignal initialized');

      // Setup notification listeners
      setupNotificationListener();

      // Set external user ID (email)
      await window.OneSignal.login(email);
      console.log('✅ User logged in with email:', email);

      // Request notification permission
      const permission = await window.OneSignal.Notifications.requestPermission();
      console.log('📢 Permission result:', permission);

      if (!permission) {
        setError('Notification permission denied. Please allow notifications and try again.');
        setLoading(false);
        return;
      }

      // Wait for subscription to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      const subscriptionId = await window.OneSignal.User.PushSubscription.id;
      const token = await window.OneSignal.User.PushSubscription.token;
      const optedIn = await window.OneSignal.User.PushSubscription.optedIn;

      console.log('Subscription ID (Player ID):', subscriptionId);
      console.log('Push Token:', token);
      console.log('Opted In:', optedIn);

      if (subscriptionId) {
        setPlayerId(subscriptionId);
        setIsSubscribed(optedIn);
        setSuccess('Successfully registered! You can now receive push notifications.');
      } else {
        setError('Registration completed but Player ID not generated yet. Please check console.');
      }
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      setError(err.message || 'Failed to register. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copied to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl shadow-2xl p-6 sm:p-10 mb-6 border border-slate-700">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-full shadow-lg">
                <Bell className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-3">
            OneSignal Push Notifications
          </h1>
          <p className="text-slate-400 text-center mb-8 text-sm sm:text-base">
            Generate your Player ID and receive real-time notifications
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                App Configuration
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-4 w-5 h-5 text-blue-400" />
                <div className="w-full pl-12 pr-4 py-4 border border-slate-600 rounded-xl bg-slate-900 text-slate-300 font-mono text-sm transition-all hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10">
                  {appId && appId !== 'your-app-id-here' ? appId : 'Not configured'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 w-5 h-5 text-blue-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-4 border border-slate-600 rounded-xl bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <div className={`w-3 h-3 rounded-full ${sdkLoaded ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-amber-500 animate-pulse'}`}></div>
              <span className="text-sm text-slate-400">
                {sdkLoaded ? 'OneSignal SDK Ready' : 'Initializing SDK...'}
              </span>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading || !sdkLoaded}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registering...
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  Register for Notifications
                </>
              )}
            </button>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-in fade-in">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-300">{success}</p>
              </div>
            )}

            {playerId && (
              <div className="space-y-4 mt-8 pt-8 border-t border-slate-700">
                <div className="p-5 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-xl">
                  <label className="block text-sm font-semibold text-blue-300 mb-3">
                    Your Player ID
                  </label>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 p-4 bg-slate-900 rounded-lg border border-slate-600 text-sm text-blue-300 font-mono break-all overflow-auto max-h-24">
                      {playerId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(playerId, 'Player ID')}
                      className="px-5 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium text-sm whitespace-nowrap shadow-lg hover:shadow-blue-500/50"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all">
                    <p className="text-xs text-slate-500 font-semibold mb-2">Status</p>
                    <p className="text-base font-bold text-emerald-400">
                      {isSubscribed ? 'Active' : 'Pending'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all">
                    <p className="text-xs text-slate-500 font-semibold mb-2">Email</p>
                    <p className="text-sm font-mono text-blue-300 truncate">{email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">How to Send Notifications:</h3>
            <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
              <li>Copy your Player ID from above</li>
              <li>Open OneSignal Dashboard</li>
              <li>Navigate to Messages → New Push</li>
              <li>Target by Player ID and send test notification</li>
            </ol>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl shadow-2xl p-6 sm:p-10 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Notifications
              <span className="text-blue-400 ml-2">({notifications.length})</span>
            </h2>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-slate-700/50 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-600">
                <Bell className="w-12 h-12 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">
                No notifications yet. Send one from OneSignal to see it here!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif, index) => (
                <div key={index} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white text-sm sm:text-base">{notif.title}</h4>
                    <span className="text-xs text-slate-500 ml-2">{notif.time}</span>
                  </div>
                  <p className="text-sm text-slate-300">{notif.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}