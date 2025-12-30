import { createSignal, For, Show } from 'solid-js';
import { css } from '../../../styled-system/css';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { accountModalOpen, addAccount } from '../../stores';
import { useStore } from '@nanostores/solid';
import {
  startGoogleOAuth,
  startMicrosoftOAuth,
  handleOAuthCallback,
  addAccount as addAccountApi,
} from '../../lib/tauri';
import { listen } from '@tauri-apps/api/event';
import type { Provider } from '../../types';

type AccountStep = 'select' | 'google' | 'microsoft' | 'caldav' | 'local' | 'oauth-pending';

interface ProviderInfo {
  id: Provider;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const providers: ProviderInfo[] = [
  {
    id: 'google',
    name: 'Google Calendar',
    description: 'Connect your Google account',
    icon: 'G',
    color: '#4285F4',
  },
  {
    id: 'microsoft',
    name: 'Microsoft Outlook',
    description: 'Connect your Microsoft 365 or Outlook.com account',
    icon: 'M',
    color: '#0078D4',
  },
  {
    id: 'caldav',
    name: 'CalDAV',
    description: 'Connect to any CalDAV server (iCloud, FastMail, etc.)',
    icon: 'C',
    color: '#6366f1',
  },
  {
    id: 'local',
    name: 'Local Calendar',
    description: 'Create a calendar stored only on this device',
    icon: 'L',
    color: '#22c55e',
  },
];

export function AccountModal() {
  const $isOpen = useStore(accountModalOpen);

  const [step, setStep] = createSignal<AccountStep>('select');
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // CalDAV form state
  const [caldavUrl, setCaldavUrl] = createSignal('');
  const [caldavUsername, setCaldavUsername] = createSignal('');
  const [caldavPassword, setCaldavPassword] = createSignal('');

  // Local calendar form state
  const [localName, setLocalName] = createSignal('');
  const [localColor, setLocalColor] = createSignal('#6366f1');

  // OAuth state
  const [oauthProvider, setOauthProvider] = createSignal<'google' | 'microsoft' | null>(null);

  const handleClose = () => {
    accountModalOpen.set(false);
    setStep('select');
    setError(null);
    setIsLoading(false);
    setCaldavUrl('');
    setCaldavUsername('');
    setCaldavPassword('');
    setLocalName('');
    setLocalColor('#6366f1');
    setOauthProvider(null);
  };

  const handleProviderSelect = (provider: Provider) => {
    setError(null);
    switch (provider) {
      case 'google':
        setStep('google');
        break;
      case 'microsoft':
        setStep('microsoft');
        break;
      case 'caldav':
        setStep('caldav');
        break;
      case 'local':
        setStep('local');
        break;
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, these would be stored securely and configured per user
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
      const redirectUri = 'chronos://oauth/callback';

      if (!clientId) {
        setError('Google OAuth is not configured. Please add VITE_GOOGLE_CLIENT_ID to your environment.');
        setIsLoading(false);
        return;
      }

      const { authUrl, state } = await startGoogleOAuth(clientId, clientSecret, redirectUri);

      // Open the auth URL in the default browser
      window.open(authUrl, '_blank');

      setOauthProvider('google');
      setStep('oauth-pending');

      // Listen for the OAuth callback
      const unlisten = await listen<{ code: string; state: string }>('oauth-callback', async (event) => {
        try {
          const { code } = event.payload;

          const tokens = await handleOAuthCallback('google', code, clientId, clientSecret, redirectUri);

          // Create the account
          const account = await addAccountApi('google', '', undefined, undefined, undefined);
          addAccount(account);

          handleClose();
        } catch (err) {
          setError(`OAuth failed: ${err}`);
          setStep('google');
        } finally {
          unlisten();
          setIsLoading(false);
        }
      });

      // Set a timeout for the OAuth flow
      setTimeout(() => {
        if (step() === 'oauth-pending') {
          unlisten();
          setError('OAuth timed out. Please try again.');
          setStep('google');
          setIsLoading(false);
        }
      }, 300000); // 5 minute timeout
    } catch (err) {
      setError(`Failed to start OAuth: ${err}`);
      setIsLoading(false);
    }
  };

  const handleMicrosoftAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || '';
      const clientSecret = import.meta.env.VITE_MICROSOFT_CLIENT_SECRET || '';
      const redirectUri = 'chronos://oauth/callback';

      if (!clientId) {
        setError('Microsoft OAuth is not configured. Please add VITE_MICROSOFT_CLIENT_ID to your environment.');
        setIsLoading(false);
        return;
      }

      const { authUrl, state } = await startMicrosoftOAuth(clientId, clientSecret, redirectUri);

      window.open(authUrl, '_blank');

      setOauthProvider('microsoft');
      setStep('oauth-pending');

      const unlisten = await listen<{ code: string; state: string }>('oauth-callback', async (event) => {
        try {
          const { code } = event.payload;

          const tokens = await handleOAuthCallback('microsoft', code, clientId, clientSecret, redirectUri);

          const account = await addAccountApi('microsoft', '', undefined, undefined, undefined);
          addAccount(account);

          handleClose();
        } catch (err) {
          setError(`OAuth failed: ${err}`);
          setStep('microsoft');
        } finally {
          unlisten();
          setIsLoading(false);
        }
      });

      setTimeout(() => {
        if (step() === 'oauth-pending') {
          unlisten();
          setError('OAuth timed out. Please try again.');
          setStep('microsoft');
          setIsLoading(false);
        }
      }, 300000);
    } catch (err) {
      setError(`Failed to start OAuth: ${err}`);
      setIsLoading(false);
    }
  };

  const handleCaldavSubmit = async (e: Event) => {
    e.preventDefault();

    if (!caldavUrl() || !caldavUsername() || !caldavPassword()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const account = await addAccountApi(
        'caldav',
        caldavUsername(),
        caldavUrl(),
        caldavUsername(),
        caldavPassword(),
      );
      addAccount(account);
      handleClose();
    } catch (err) {
      setError(`Failed to connect: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalSubmit = async (e: Event) => {
    e.preventDefault();

    if (!localName()) {
      setError('Please enter a calendar name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const account = await addAccountApi('local', localName(), undefined, undefined, undefined);
      addAccount(account);
      handleClose();
    } catch (err) {
      setError(`Failed to create calendar: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Show when={$isOpen()}>
      <div
        class={css({
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        })}
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <div
          class={css({
            width: '100%',
            maxWidth: '28rem',
            backgroundColor: 'var(--colors-background)',
            borderRadius: '0.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--colors-border)',
            overflow: 'hidden',
          })}
        >
          {/* Header */}
          <div
            class={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--colors-border)',
            })}
          >
            <div class={css({ display: 'flex', alignItems: 'center', gap: '0.75rem' })}>
              <Show when={step() !== 'select'}>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  class={css({
                    padding: '0.25rem',
                    borderRadius: '0.25rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--colors-foreground)',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'var(--colors-muted)',
                    },
                  })}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </Show>
              <h2
                class={css({
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--colors-foreground)',
                })}
              >
                {step() === 'select' && 'Add Account'}
                {step() === 'google' && 'Google Calendar'}
                {step() === 'microsoft' && 'Microsoft Outlook'}
                {step() === 'caldav' && 'CalDAV Server'}
                {step() === 'local' && 'Local Calendar'}
                {step() === 'oauth-pending' && 'Connecting...'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              class={css({
                padding: '0.5rem',
                borderRadius: '0.375rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--colors-foreground)',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'var(--colors-muted)',
                },
              })}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div class={css({ padding: '1.5rem' })}>
            {/* Error message */}
            <Show when={error()}>
              <div
                class={css({
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--colors-error)',
                  color: 'var(--colors-error)',
                  fontSize: '0.875rem',
                })}
              >
                {error()}
              </div>
            </Show>

            {/* Provider Selection */}
            <Show when={step() === 'select'}>
              <div class={css({ display: 'flex', flexDirection: 'column', gap: '0.75rem' })}>
                <For each={providers}>
                  {(provider) => (
                    <button
                      type="button"
                      onClick={() => handleProviderSelect(provider.id)}
                      class={css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--colors-border)',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: 'var(--colors-primary)',
                          backgroundColor: 'var(--colors-muted)',
                        },
                      })}
                    >
                      <div
                        style={{ 'background-color': provider.color }}
                        class={css({
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '1.25rem',
                        })}
                      >
                        {provider.icon}
                      </div>
                      <div>
                        <div
                          class={css({
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'var(--colors-foreground)',
                          })}
                        >
                          {provider.name}
                        </div>
                        <div
                          class={css({
                            fontSize: '0.75rem',
                            color: 'var(--colors-foreground)',
                            opacity: 0.6,
                          })}
                        >
                          {provider.description}
                        </div>
                      </div>
                    </button>
                  )}
                </For>
              </div>
            </Show>

            {/* Google OAuth */}
            <Show when={step() === 'google'}>
              <div class={css({ textAlign: 'center' })}>
                <p
                  class={css({
                    fontSize: '0.875rem',
                    color: 'var(--colors-foreground)',
                    marginBottom: '1.5rem',
                  })}
                >
                  Click the button below to sign in with your Google account. You'll be redirected to Google to authorize Chronos.
                </p>
                <Button variant="primary" onClick={handleGoogleAuth} disabled={isLoading()}>
                  {isLoading() ? 'Connecting...' : 'Sign in with Google'}
                </Button>
              </div>
            </Show>

            {/* Microsoft OAuth */}
            <Show when={step() === 'microsoft'}>
              <div class={css({ textAlign: 'center' })}>
                <p
                  class={css({
                    fontSize: '0.875rem',
                    color: 'var(--colors-foreground)',
                    marginBottom: '1.5rem',
                  })}
                >
                  Click the button below to sign in with your Microsoft account. You'll be redirected to Microsoft to authorize Chronos.
                </p>
                <Button variant="primary" onClick={handleMicrosoftAuth} disabled={isLoading()}>
                  {isLoading() ? 'Connecting...' : 'Sign in with Microsoft'}
                </Button>
              </div>
            </Show>

            {/* CalDAV Form */}
            <Show when={step() === 'caldav'}>
              <form onSubmit={handleCaldavSubmit}>
                <div class={css({ display: 'flex', flexDirection: 'column', gap: '1rem' })}>
                  <Input
                    label="CalDAV URL"
                    type="url"
                    value={caldavUrl()}
                    onInput={(e) => setCaldavUrl(e.currentTarget.value)}
                    placeholder="https://caldav.example.com/calendars/"
                    required
                  />
                  <Input
                    label="Username"
                    value={caldavUsername()}
                    onInput={(e) => setCaldavUsername(e.currentTarget.value)}
                    placeholder="your@email.com"
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={caldavPassword()}
                    onInput={(e) => setCaldavPassword(e.currentTarget.value)}
                    placeholder="Your password or app-specific password"
                    required
                  />

                  <div class={css({ marginTop: '0.5rem' })}>
                    <p
                      class={css({
                        fontSize: '0.75rem',
                        color: 'var(--colors-foreground)',
                        opacity: 0.6,
                      })}
                    >
                      Common CalDAV URLs:
                    </p>
                    <ul
                      class={css({
                        fontSize: '0.75rem',
                        color: 'var(--colors-foreground)',
                        opacity: 0.6,
                        marginTop: '0.25rem',
                        marginLeft: '1rem',
                        listStyleType: 'disc',
                      })}
                    >
                      <li>iCloud: https://caldav.icloud.com/</li>
                      <li>FastMail: https://caldav.fastmail.com/</li>
                      <li>Nextcloud: https://your-server.com/remote.php/dav/</li>
                    </ul>
                  </div>

                  <Button type="submit" variant="primary" disabled={isLoading()}>
                    {isLoading() ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </form>
            </Show>

            {/* Local Calendar Form */}
            <Show when={step() === 'local'}>
              <form onSubmit={handleLocalSubmit}>
                <div class={css({ display: 'flex', flexDirection: 'column', gap: '1rem' })}>
                  <Input
                    label="Calendar Name"
                    value={localName()}
                    onInput={(e) => setLocalName(e.currentTarget.value)}
                    placeholder="Personal"
                    required
                  />

                  <div>
                    <label
                      class={css({
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'var(--colors-foreground)',
                        marginBottom: '0.375rem',
                      })}
                    >
                      Color
                    </label>
                    <div class={css({ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' })}>
                      <For
                        each={[
                          '#6366f1',
                          '#8b5cf6',
                          '#ec4899',
                          '#ef4444',
                          '#f97316',
                          '#eab308',
                          '#22c55e',
                          '#14b8a6',
                          '#06b6d4',
                          '#3b82f6',
                        ]}
                      >
                        {(color) => (
                          <button
                            type="button"
                            onClick={() => setLocalColor(color)}
                            style={{ 'background-color': color }}
                            class={css({
                              width: '2rem',
                              height: '2rem',
                              borderRadius: '0.375rem',
                              border: '2px solid',
                              borderColor: localColor() === color ? 'white' : 'transparent',
                              cursor: 'pointer',
                              boxShadow:
                                localColor() === color ? '0 0 0 2px var(--colors-primary)' : 'none',
                            })}
                          />
                        )}
                      </For>
                    </div>
                  </div>

                  <p
                    class={css({
                      fontSize: '0.75rem',
                      color: 'var(--colors-foreground)',
                      opacity: 0.6,
                    })}
                  >
                    Local calendars are stored only on this device and won't sync with other services.
                  </p>

                  <Button type="submit" variant="primary" disabled={isLoading()}>
                    {isLoading() ? 'Creating...' : 'Create Calendar'}
                  </Button>
                </div>
              </form>
            </Show>

            {/* OAuth Pending */}
            <Show when={step() === 'oauth-pending'}>
              <div class={css({ textAlign: 'center', paddingY: '2rem' })}>
                <div
                  class={css({
                    width: '3rem',
                    height: '3rem',
                    margin: '0 auto',
                    marginBottom: '1rem',
                    border: '3px solid var(--colors-muted)',
                    borderTopColor: 'var(--colors-primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  })}
                />
                <p
                  class={css({
                    fontSize: '0.875rem',
                    color: 'var(--colors-foreground)',
                  })}
                >
                  Waiting for authorization...
                </p>
                <p
                  class={css({
                    fontSize: '0.75rem',
                    color: 'var(--colors-foreground)',
                    opacity: 0.6,
                    marginTop: '0.5rem',
                  })}
                >
                  Complete the sign-in process in your browser
                </p>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
}
