import { DeleteOutlined, EditOutlined, LogoutOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Badge,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { Role } from '@/api/auth.ts'
import { ApiError } from '@/api/client/index.ts'
import {
  createUser,
  deleteUser,
  getUser,
  kickUser,
  listUsers,
  setUserStatus,
  updateUser,
  type UpdateUserInput,
  type User,
  type UserFilters,
  type UserPage,
} from '@/api/users.ts'
import { ApiErrorPanel } from '@/components/ApiErrorPanel.tsx'
import { useI18n } from '@/locales/index.ts'
import { useAuth } from '@/store/auth.ts'
import { passwordByteRule } from '@/utils/password.ts'

type UserFormValues = { email: string; remark: string; password?: string; role: Role; active: boolean }
const defaultFilters: UserFilters = { page: 1, pageSize: 20 }

export function UsersPage() {
  const [messageApi, messageContext] = message.useMessage()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const { t, locale } = useI18n()
  const [filters, setFilters] = useState<UserFilters>(defaultFilters)
  const [emailInput, setEmailInput] = useState('')
  const [draft, setDraft] = useState<UserFormValues>({ email: '', remark: '', password: '', role: 'user', active: true })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<UserFormValues>()
  const usersQuery = useQuery({ queryKey: ['users', 'list', filters], queryFn: () => listUsers(filters) })
  const detailQuery = useQuery({
    queryKey: ['users', 'detail', editingUser?.id],
    queryFn: () => getUser(editingUser!.id),
    enabled: Boolean(modalOpen && editingUser),
  })
  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['users'] })
  const markUserOffline = (id: string) => {
    queryClient.setQueriesData<UserPage>({ queryKey: ['users', 'list'] }, (current) => {
      if (!current?.data) return current
      return {
        ...current,
        data: current.data.map((user) => (user.id === id ? { ...user, online: false } : user)),
      }
    })
    queryClient.setQueryData<User>(['users', 'detail', id], (current) => (current ? { ...current, online: false } : current))
    setEditingUser((current) => (current?.id === id ? { ...current, online: false } : current))
  }
  const modalUser = detailQuery.data ?? editingUser
  const closeModal = () => {
    setModalOpen(false)
    setEditingUser(null)
    form.resetFields()
  }
  const openCreate = () => {
    setEditingUser(null)
    const values = { email: '', remark: '', password: '', role: 'user' as Role, active: true }
    setDraft(values)
    form.setFieldsValue(values)
    setModalOpen(true)
  }
  const openEdit = (record: User) => {
    setEditingUser(record)
    const values = {
      email: record.email,
      remark: record.remark,
      password: '',
      role: record.role,
      active: record.active,
    }
    setDraft(values)
    form.setFieldsValue(values)
    setModalOpen(true)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const email = emailInput.trim() || undefined
      setFilters((current) => {
        if (current.email === email) return current
        return { ...current, email, page: 1 }
      })
    }, 400)
    return () => window.clearTimeout(timer)
  }, [emailInput])

  const isSelf = (record: User) => currentUser?.id === record.id

  const saveMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (editingUser) {
        const input: UpdateUserInput = {}
        const email = values.email.trim().toLowerCase()
        if (email !== editingUser.email) input.email = email
        if (values.remark !== editingUser.remark) input.remark = values.remark
        if (values.password) input.password = values.password
        if (!isSelf(editingUser) && values.role !== editingUser.role) input.role = values.role
        if (Object.keys(input).length === 0) return editingUser
        return updateUser(editingUser.id, input)
      }
      return createUser({
        email: values.email,
        remark: values.remark,
        password: values.password ?? '',
        role: values.role,
        active: values.active,
      })
    },
    onSuccess: () => {
      messageApi.success(editingUser ? t('users.updated') : t('users.created'))
      closeModal()
      void invalidateUsers()
    },
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setUserStatus(id, active),
    onSuccess: (user) => {
      messageApi.success(t('users.statusUpdated'))
      markUserOffline(user.id)
      void invalidateUsers()
    },
  })
  const kickMutation = useMutation({
    mutationFn: kickUser,
    onSuccess: (_data, id) => {
      messageApi.success(t('users.kicked'))
      markUserOffline(id)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      messageApi.success(t('users.deleted'))
      void invalidateUsers()
    },
  })

  const columns = [
    {
      title: t('users.email'),
      dataIndex: 'email',
      ellipsis: true,
      width: 240,
    },
    {
      title: t('users.remark'),
      dataIndex: 'remark',
      ellipsis: true,
      width: 180,
      render: (remark: string) => remark || '—',
    },
    {
      title: t('users.role'),
      dataIndex: 'role',
      width: 120,
      render: (role: Role) => <Tag color={role === 'admin' ? 'gold' : 'blue'}>{role === 'admin' ? t('role.admin') : t('role.user')}</Tag>,
    },
    {
      title: t('users.status'),
      dataIndex: 'active',
      width: 128,
      render: (active: boolean, record: User) => (
        <Switch
          size="small"
          checked={active}
          checkedChildren={t('users.active')}
          unCheckedChildren={t('users.inactive')}
          disabled={isSelf(record) || statusMutation.isPending}
          onChange={(value) => statusMutation.mutate({ id: record.id, active: value })}
        />
      ),
    },
    {
      title: t('users.onlineStatus'),
      dataIndex: 'online',
      width: 112,
      render: (online: boolean) => (
        <Tooltip title={online ? t('users.onlineHint') : t('users.offlineHint')}>
          <Badge status={online ? 'success' : 'default'} text={online ? t('users.online') : t('users.offline')} />
        </Tooltip>
      ),
    },
    {
      title: t('users.createdAt'),
      dataIndex: 'created_at',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString(locale, { hour12: false }),
    },
    {
      title: t('users.actions'),
      key: 'actions',
      width: 136,
      fixed: 'right' as const,
      render: (_: unknown, record: User) => {
        const canKick = record.online && !isSelf(record) && !kickMutation.isPending
        return (
          <Space size={0} wrap={false}>
            <Tooltip title={t('users.editAction')}>
              <Button type="link" size="small" aria-label={t('users.editAction')} icon={<EditOutlined />} onClick={() => openEdit(record)} />
            </Tooltip>
            <Popconfirm
              title={t('users.kickConfirmTitle')}
              description={t('users.kickConfirmDesc')}
              disabled={!canKick}
              onConfirm={() => kickMutation.mutate(record.id)}
            >
              <Tooltip title={canKick ? t('users.kick') : isSelf(record) ? t('users.kick') : t('users.kickUnavailable')}>
                <Button type="link" size="small" aria-label={t('users.kick')} icon={<LogoutOutlined />} disabled={!canKick} />
              </Tooltip>
            </Popconfirm>
            <Popconfirm
              title={t('users.deleteConfirmTitle')}
              description={t('users.deleteConfirmDesc')}
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteMutation.mutate(record.id)}
            >
              <Tooltip title={t('users.remove')}>
                <Button type="link" size="small" danger aria-label={t('users.remove')} icon={<DeleteOutlined />} disabled={isSelf(record) || deleteMutation.isPending} />
              </Tooltip>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]
  const pagination: TablePaginationConfig = {
    current: filters.page,
    pageSize: filters.pageSize,
    total: usersQuery.data?.total ?? 0,
    showSizeChanger: true,
    showTotal: (total) => t('users.total', { total }),
    onChange: (page, pageSize) => setFilters((current) => ({ ...current, page, pageSize })),
  }
  if (usersQuery.error instanceof ApiError && usersQuery.error.code === 'FORBIDDEN') {
    return <Navigate to="/403" replace />
  }

  const save = async () => {
    const values = await form.validateFields()
    if (editingUser) {
      const email = values.email.trim().toLowerCase()
      const unchanged =
        email === editingUser.email &&
        values.remark === editingUser.remark &&
        !values.password &&
        (isSelf(editingUser) || values.role === editingUser.role)
      if (unchanged) {
        messageApi.info(t('users.noChanges'))
        return
      }
    }
    saveMutation.mutate(values)
  }

  return (
    <>
      {messageContext}
      <div className="app-surface flex h-full min-h-0 flex-col overflow-hidden">
        {usersQuery.isError ? (
          <ApiErrorPanel error={usersQuery.error} onRetry={() => void usersQuery.refetch()} />
        ) : (
          <Table<User>
            className="app-table"
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            scroll={{ x: 1096 }}
            columns={columns}
            dataSource={usersQuery.data?.data ?? []}
            loading={usersQuery.isLoading || usersQuery.isFetching}
            pagination={{ ...pagination, size: 'small' }}
            locale={{ emptyText: t('users.empty') }}
            title={() => (
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full sm:w-60">
                  <Input
                    placeholder={t('users.filterEmail')}
                    allowClear
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                  />
                </div>
                <div className="w-full sm:w-36">
                  <Select
                    placeholder={t('users.allRoles')}
                    allowClear
                    className="w-full"
                    value={filters.role}
                    onChange={(role) => setFilters((current) => ({ ...current, role, page: 1 }))}
                    options={[
                      { value: 'admin', label: t('role.admin') },
                      { value: 'user', label: t('role.user') },
                    ]}
                  />
                </div>
                <div className="w-full sm:w-36">
                  <Select
                    placeholder={t('users.allStatus')}
                    allowClear
                    className="w-full"
                    value={filters.active}
                    onChange={(active) => setFilters((current) => ({ ...current, active, page: 1 }))}
                    options={[
                      { value: true, label: t('users.enabled') },
                      { value: false, label: t('users.disabled') },
                    ]}
                  />
                </div>
                <Button icon={<ReloadOutlined />} onClick={() => void usersQuery.refetch()}>
                  {t('users.refresh')}
                </Button>
                <div className="flex-1" />
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  {t('users.create')}
                </Button>
              </div>
            )}
          />
        )}
      </div>

      <Modal
        title={editingUser ? t('users.edit') : t('users.create')}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => void save()}
        confirmLoading={saveMutation.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" initialValues={draft} className="pt-2">
          <Form.Item name="email" label={t('users.email')} rules={[{ required: true, type: 'email', max: 254 }]}>
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item name="remark" label={t('users.remark')} rules={[{ required: true, max: 100, message: t('users.remarkRequired') }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingUser ? t('users.newPassword') : t('users.password')}
            rules={[passwordByteRule(!editingUser)]}
            extra={editingUser ? t('users.passwordHintEdit') : t('users.passwordHintCreate')}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="role"
            label={t('users.role')}
            rules={[{ required: true }]}
            extra={editingUser && isSelf(editingUser) ? t('users.cannotChangeOwnRole') : undefined}
          >
            <Select
              disabled={Boolean(editingUser && isSelf(editingUser))}
              options={[
                { value: 'admin', label: t('role.admin') },
                { value: 'user', label: t('role.user') },
              ]}
            />
          </Form.Item>
          {editingUser && (
            <Form.Item label={t('users.onlineStatus')} extra={modalUser?.online ? t('users.onlineHint') : t('users.offlineHint')}>
              <Badge
                status={modalUser?.online ? 'success' : 'default'}
                text={modalUser?.online ? t('users.online') : t('users.offline')}
              />
            </Form.Item>
          )}
          {!editingUser && (
            <Form.Item name="active" label={t('users.status')} valuePropName="checked">
              <Switch checkedChildren={t('users.active')} unCheckedChildren={t('users.inactive')} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  )
}
