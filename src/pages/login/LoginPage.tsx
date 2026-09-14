import { LockOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCaptcha, type CaptchaData, type LoginRequest } from '@/api/auth.ts'
import { ApiError, mapApiError, type ApiErrorCode } from '@/api/client/index.ts'
import { AppearanceControls } from '@/components/AppearanceControls.tsx'
import { PageLoading } from '@/components/PageLoading.tsx'
import { useI18n } from '@/locales/index.ts'
import { useAuth } from '@/store/auth.ts'

type LoginValues = { email: string; password: string; captcha: string }
type LoginLocationState = {
  expired?: boolean
  from?: { pathname?: string; search?: string; hash?: string }
}

const loginErrorKeys: Partial<Record<ApiErrorCode, string>> = {
  INVALID_REQUEST: 'login.errors.INVALID_REQUEST',
  INVALID_CAPTCHA: 'login.errors.INVALID_CAPTCHA',
  INVALID_CREDENTIALS: 'login.errors.INVALID_CREDENTIALS',
  TOO_MANY_REQUESTS: 'login.errors.TOO_MANY_REQUESTS',
  RATE_LIMITED: 'login.errors.RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'login.errors.SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'login.errors.INTERNAL_ERROR',
}

function safeRedirect(state: LoginLocationState | null) {
  const pathname = state?.from?.pathname
  if (!pathname || pathname === '/login' || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return '/dashboard'
  }
  return `${pathname}${state?.from?.search ?? ''}${state?.from?.hash ?? ''}`
}

function shouldRefreshCaptcha(error: unknown) {
  if (!(error instanceof ApiError)) return true
  return error.code !== 'TOO_MANY_REQUESTS' && error.code !== 'RATE_LIMITED' && error.code !== 'SERVICE_UNAVAILABLE'
}

export function LoginPage() {
  const { user, isLoading, signIn } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const state = (location.state as LoginLocationState | null) ?? null

  if (isLoading) return <PageLoading fullScreen label={t('login.restoringSession')} />
  if (user) return <Navigate to={safeRedirect(state)} replace />

  return <LoginForm signIn={signIn} />
}

function LoginForm({ signIn }: { signIn: (input: LoginRequest) => Promise<void> }) {
  const { t } = useI18n()
  const [form] = Form.useForm<LoginValues>()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null)
  const [captchaLoading, setCaptchaLoading] = useState(true)
  const captchaRequest = useRef(0)

  const loginErrorMessage = useCallback(
    (reason: unknown) => {
      const mapped = mapApiError(reason)
      const key = loginErrorKeys[mapped.code]
      return key ? t(key) : mapped.description
    },
    [t],
  )

  const loadCaptcha = useCallback(
    async (options?: { keepError?: boolean }) => {
      const requestId = ++captchaRequest.current
      form.setFieldValue('captcha', '')
      setCaptchaLoading(true)
      try {
        const data = await getCaptcha()
        if (requestId !== captchaRequest.current) return
        setCaptcha(data)
        if (!options?.keepError) setError('')
      } catch (reason) {
        if (requestId !== captchaRequest.current) return
        setCaptcha(null)
        setError(loginErrorMessage(reason))
      } finally {
        if (requestId === captchaRequest.current) setCaptchaLoading(false)
      }
    },
    [form, loginErrorMessage],
  )

  useEffect(() => {
    void loadCaptcha()
  }, [loadCaptcha])

  useEffect(() => {
    if (!captcha?.expires_in) return
    const timer = window.setTimeout(() => {
      void loadCaptcha()
    }, captcha.expires_in * 1000)
    return () => window.clearTimeout(timer)
  }, [captcha, loadCaptcha])

  const submit = async ({ email, password, captcha: captchaCode }: LoginValues) => {
    if (!captcha) {
      setError(t('login.captchaMissing'))
      await loadCaptcha()
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await signIn({
        email,
        password,
        captcha_id: captcha.captcha_id,
        captcha: captchaCode,
      })
    } catch (reason) {
      setError(loginErrorMessage(reason))
      if (shouldRefreshCaptcha(reason)) await loadCaptcha({ keepError: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <AppearanceControls className="login-toolbar" />
      <div className="login-card">
        <div className="login-brand">
          <span className="login-brand-mark">S</span>
          <p className="login-brand-name">{t('common.appName')}</p>
          <p className="login-brand-sub">{t('common.appSubtitle')}</p>
        </div>
        {error && <Alert className="mb-4" type="error" showIcon title={error} />}
        <Form<LoginValues> form={form} layout="vertical" requiredMark={false} onFinish={(values) => void submit(values)}>
          <Form.Item
            name="email"
            label={t('login.email')}
            rules={[
              { required: true, message: t('login.emailRequired') },
              { type: 'email', message: t('login.emailInvalid') },
            ]}
          >
            <Input size="large" autoComplete="email" placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item name="password" label={t('login.password')} rules={[{ required: true, message: t('login.passwordRequired') }]}>
            <Input.Password size="large" autoComplete="current-password" placeholder={t('login.passwordRequired')} />
          </Form.Item>
          <Form.Item label={t('login.captcha')} required>
            <div className="login-captcha">
              <Form.Item
                name="captcha"
                noStyle
                rules={[
                  { required: true, message: t('login.captchaRequired') },
                  { len: 4, message: t('login.captchaLength') },
                ]}
              >
                <Input
                  size="large"
                  maxLength={4}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder={t('login.captchaPlaceholder')}
                />
              </Form.Item>
              <button
                type="button"
                className="login-captcha-image"
                onClick={() => void loadCaptcha()}
                disabled={captchaLoading}
                title={t('login.captchaRefresh')}
                aria-label={t('login.captchaRefresh')}
              >
                {captcha ? (
                  <img src={captcha.image} alt={t('login.captchaAlt')} />
                ) : (
                  <span className="login-captcha-placeholder">
                    {captchaLoading ? t('login.captchaLoading') : t('login.captchaFetch')}
                  </span>
                )}
              </button>
            </div>
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            icon={<LockOutlined />}
            loading={submitting}
            disabled={captchaLoading && !captcha}
            aria-label={t('login.submit')}
            block
          >
            {t('login.submit')}
          </Button>
        </Form>
      </div>
    </main>
  )
}
