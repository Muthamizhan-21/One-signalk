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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-purple-600 p-3 rounded-full">
              <Bell className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
            OneSignal Web Push - Frontend Demo
          </h1>
          <p className="text-gray-600 text-center mb-6 text-sm">
            Register and see notifications in real-time
          </p>

          <div className="space-y-4">
            {/* App ID Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OneSignal App ID (from .env)
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <div className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm">
                  {appId && appId !== 'your-app-id-here' ? appId : 'Not configured - check .env file'}
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email (External User ID)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* SDK Status */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${sdkLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
              <span className="text-sm text-gray-600">
                {sdkLoaded ? 'OneSignal SDK Ready' : 'Loading OneSignal SDK...'}
              </span>
            </div>

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={loading || !sdkLoaded}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Registering...
                </>
              ) : (
                'Register for Push Notifications'
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Player ID & Info Display */}
            {playerId && (
              <div className="space-y-3">
                <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <label className="block text-sm font-medium text-purple-900 mb-2">
                    Player ID (Subscription ID):
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-white rounded border border-purple-200 text-sm text-purple-800 font-mono break-all">
                      {playerId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(playerId, 'Player ID')}
                      className="px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm font-medium whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium mb-1">Status</p>
                    <p className="text-sm font-semibold text-blue-900">
                      {isSubscribed ? 'Subscribed' : 'Pending'}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 font-medium mb-1">User ID</p>
                    <p className="text-sm font-semibold text-green-900 truncate">{email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Next Steps:</h3>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Copy your Player ID above</li>
              <li>Go to OneSignal Dashboard → Messages → New Push</li>
              <li>Select "Send to Particular Segment" or use the Player ID</li>
              <li>Send a test notification and watch it appear below!</li>
            </ol>
          </div>
        </div>

        {/* Notifications Panel */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Received Notifications ({notifications.length})
            </h2>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                No notifications received yet. Send a test notification from OneSignal!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{notif.title}</h4>
                    <span className="text-xs text-gray-500">{notif.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}