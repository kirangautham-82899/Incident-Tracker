/**
 * Push Notification Service
 * Handles browser push notifications for critical incidents
 */

class NotificationService {
    constructor() {
        this.permission = 'default';
        this.isSupported = 'Notification' in window;
    }

    /**
     * Check if notifications are supported
     */
    isNotificationSupported() {
        return this.isSupported;
    }

    /**
     * Get current permission status
     */
    getPermission() {
        if (!this.isSupported) return 'denied';
        return Notification.permission;
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!this.isSupported) {
            console.warn('Notifications not supported in this browser');
            return 'denied';
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }

    /**
     * Show a notification
     */
    showNotification(title, options = {}) {
        if (!this.isSupported || this.getPermission() !== 'granted') {
            console.warn('Notifications not granted');
            return null;
        }

        const defaultOptions = {
            icon: '/icon.svg',
            badge: '/icon.svg',
            vibrate: [200, 100, 200],
            requireInteraction: false,
            ...options
        };

        try {
            const notification = new Notification(title, defaultOptions);

            // Auto-close after 5 seconds unless requireInteraction is true
            if (!options.requireInteraction) {
                setTimeout(() => notification.close(), 5000);
            }

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            return null;
        }
    }

    /**
     * Show incident notification
     */
    notifyNewIncident(incident) {
        const title = `🚨 New Incident: ${incident.type}`;
        const options = {
            body: incident.title,
            icon: '/icon.svg',
            tag: `incident-${incident._id}`,
            requireInteraction: incident.severity === 'critical',
            data: {
                incidentId: incident._id,
                url: `/dashboard`
            },
            actions: [
                { action: 'view', title: 'View Details' },
                { action: 'close', title: 'Dismiss' }
            ]
        };

        const notification = this.showNotification(title, options);

        if (notification) {
            notification.onclick = () => {
                window.focus();
                window.location.href = '/dashboard';
                notification.close();
            };
        }

        return notification;
    }

    /**
     * Show critical alert
     */
    notifyCriticalIncident(incident) {
        const title = `⚠️ CRITICAL ALERT: ${incident.type.toUpperCase()}`;
        const options = {
            body: `${incident.title}\n\nLocation: ${incident.location?.address || 'Unknown'}`,
            icon: '/icon.svg',
            tag: `critical-${incident._id}`,
            requireInteraction: true,
            vibrate: [300, 100, 300, 100, 300],
            data: {
                incidentId: incident._id,
                url: `/dashboard`
            }
        };

        const notification = this.showNotification(title, options);

        if (notification) {
            notification.onclick = () => {
                window.focus();
                window.location.href = '/dashboard';
                notification.close();
            };
        }

        return notification;
    }

    /**
     * Show verification notification
     */
    notifyVerification(incident) {
        const title = '✅ Incident Verified';
        const options = {
            body: `Your report "${incident.title}" has been verified`,
            icon: '/icon.svg',
            tag: `verified-${incident._id}`,
            data: {
                incidentId: incident._id,
                url: `/dashboard`
            }
        };

        return this.showNotification(title, options);
    }

    /**
     * Show status update notification
     */
    notifyStatusUpdate(incident, newStatus) {
        const statusEmojis = {
            'reported': '📝',
            'in-progress': '🔄',
            'resolved': '✅',
            'closed': '🔒'
        };

        const title = `${statusEmojis[newStatus] || '📢'} Status Update`;
        const options = {
            body: `Incident "${incident.title}" is now ${newStatus}`,
            icon: '/icon.svg',
            tag: `status-${incident._id}`,
            data: {
                incidentId: incident._id,
                url: `/dashboard`
            }
        };

        return this.showNotification(title, options);
    }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
