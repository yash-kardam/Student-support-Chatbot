import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default function OnboardingTour({ user, currentView }) {
  useEffect(() => {
    // Only run tour on the Home screen for authenticated users
    if (!user || currentView !== 'home') return;
    
    const tourKey = `nero_tour_done_${user.id}`;
    if (localStorage.getItem(tourKey)) return;

    const isMobile = window.innerWidth <= 768;

    const steps = [
      {
        element: '.home-header',
        popover: {
          title: 'Welcome to NERO! ✨',
          description: 'Your new AI student companion is here to support your mental health, studies, and daily life.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: isMobile ? '.mobile-menu-btn' : '.stratify-sidebar',
        popover: {
          title: 'Navigate Anywhere',
          description: 'Access your past chats, action plans, and saved resources from the menu.',
          side: isMobile ? 'bottom' : 'right',
          align: 'start'
        }
      },
      {
        element: '.suggestions-col',
        popover: {
          title: 'Quick Actions',
          description: 'Jump straight into a session, take a breathing break, or review concepts.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.tasks-section',
        popover: {
          title: 'Your Action Plan',
          description: 'Track your important tasks and stay organized effortlessly.',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '.floating-input-container',
        popover: {
          title: 'Chat with NERO',
          description: 'Whenever you need to talk, just start typing here. I am always listening.',
          side: 'top',
          align: 'center'
        }
      }
    ];

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(15, 23, 42, 0.6)',
      steps: steps,
      onDestroyed: () => {
        localStorage.setItem(tourKey, 'true');
      }
    });
    
    // Slight delay to ensure DOM is fully rendered before querying elements
    const timer = setTimeout(() => {
       driverObj.drive();
    }, 800);

    return () => clearTimeout(timer);
  }, [user, currentView]);

  return null;
}
