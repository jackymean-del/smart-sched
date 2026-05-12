import { useState } from "react"
import { Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTimetableStore } from "@/store/timetableStore"
import { ORG_CONFIGS } from "@/lib/orgData"
import { rebuildTeacherTT } from "@/lib/aiEngine"

interface Props {
  target: { section: string; day: string; periodId: string }
  onClose: () => void
}

export function EditCellModal({ target, onClose }: Props) {
  const { config, classTT, teacherTT, updateCell, setTeacherTT } = useTimetableStore()
  const org = ORG_CONFIGS[config.orgType ?? "school"]
  const cell = classTT[target.section]?.[target.day]?.[target.periodId] ?? { subject: "", teacher: "", room: "" }

  const [subject, setSubject] = useState(cell.subject ?? "")
  const [teacher, setTeacher] = useState(cell.teacher ?? "")
  const [room, setRoom] = useState(cell.room ?? "")

  const save = () => {
    updateCell(target.section, target.day, target.periodId, { subject, teacher, room })
    const newTT = { ...teacherTT }
    const store = useTimetableStore.getState()
    rebuildTeacherTT(store.classTT, newTT, store.config.workDays)
    setTeacherTT(newTT)
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Pencil className="w-4 h-4 text-gray-400" /> Edit Period
          </DialogTitle>
        </DialogHeader>
        <div className="text-[10px] text-gray-400 mb-3 font-mono">
          {target.section} · {target.day} · {target.periodId}
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 block mb-1">{org.subjectLabel}</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} className="text-sm" placeholder="Subject name" />
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 block mb-1">{org.staffLabel}</label>
            <Input value={teacher} onChange={e => setTeacher(e.target.value)} className="text-sm" placeholder="Teacher name" />
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Room</label>
            <Input value={room} onChange={e => setRoom(e.target.value)} className="text-sm" placeholder="Room number" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} className="flex-1">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
