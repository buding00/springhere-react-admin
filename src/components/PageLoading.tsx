import { Spin } from 'antd'

export function PageLoading({ label, fullScreen = false }: { label: string; fullScreen?: boolean }) {
  return (
    <div className={`grid place-items-center ${fullScreen ? 'min-h-screen bg-surface' : 'min-h-64'}`}>
      <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
        <Spin size="large" />
        <p className="m-0">{label}</p>
      </div>
    </div>
  )
}
