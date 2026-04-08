import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  ResumeData,
  BasicInfo,
  Experience,
  Project,
  Education,
  Skill,
  MenuSection,
  GlobalSettings,
  Certificate,
  CustomSectionItem,
  PhotoConfig,
  CustomField,
} from '../types'
import { createEmptyResumeData, defaultPhotoConfig } from '../config/initialResumeData'

interface ResumeStore {
  resumeData: ResumeData
  activeSection: string
  isDirty: boolean

  // Core
  setResumeData: (data: ResumeData) => void
  resetResumeData: () => void

  // Basic Info
  updateBasicInfo: (updates: Partial<BasicInfo>) => void

  // Photo
  updatePhoto: (photo: string) => void
  updatePhotoConfig: (config: Partial<PhotoConfig>) => void

  // Custom fields
  addCustomField: () => void
  updateCustomField: (id: string, updates: Partial<CustomField>) => void
  removeCustomField: (id: string) => void

  // Skills
  updateSkill: (id: string, updates: Partial<Skill>) => void
  addSkill: () => void
  removeSkill: (id: string) => void
  updateSkillsBatch: (items: Skill[]) => void

  // Experience
  updateExperience: (id: string, updates: Partial<Experience>) => void
  addExperience: () => void
  removeExperience: (id: string) => void
  updateExperienceBatch: (items: Experience[]) => void

  // Projects
  updateProject: (id: string, updates: Partial<Project>) => void
  addProject: () => void
  removeProject: (id: string) => void
  updateProjectsBatch: (items: Project[]) => void

  // Education
  updateEducation: (id: string, updates: Partial<Education>) => void
  addEducation: () => void
  removeEducation: (id: string) => void
  updateEducationBatch: (items: Education[]) => void

  // Certificates
  addCertificate: () => void
  updateCertificate: (id: string, updates: Partial<Certificate>) => void
  removeCertificate: (id: string) => void

  // Custom sections
  addCustomSection: (title: string) => void
  removeCustomSection: (id: string) => void
  addCustomSectionItem: (sectionId: string) => void
  updateCustomSectionItem: (
    sectionId: string,
    itemId: string,
    updates: Partial<CustomSectionItem>,
  ) => void
  removeCustomSectionItem: (sectionId: string, itemId: string) => void

  // Sections
  toggleSection: (id: string) => void
  reorderSections: (sections: MenuSection[]) => void

  // Settings
  updateGlobalSettings: (updates: Partial<GlobalSettings>) => void
  setThemeColor: (color: string) => void

  // UI
  setActiveSection: (section: string) => void
  setDirty: (dirty: boolean) => void
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      resumeData: createEmptyResumeData(),
      activeSection: 'basicInfo',
      isDirty: false,

      // ── Core ──────────────────────────────────────────────────────────

      setResumeData: (data) =>
        set({
          resumeData: {
            ...data,
            basicInfo: {
              ...data.basicInfo,
              photoConfig: data.basicInfo.photoConfig ?? { ...defaultPhotoConfig },
              customFields: data.basicInfo.customFields ?? [],
              photo: data.basicInfo.photo ?? '',
            },
            certificates: data.certificates ?? [],
            customSections: data.customSections ?? [],
          },
          isDirty: true,
        }),

      resetResumeData: () =>
        set({
          resumeData: createEmptyResumeData(),
          activeSection: 'basicInfo',
          isDirty: false,
        }),

      // ── Basic Info ────────────────────────────────────────────────────

      updateBasicInfo: (updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            basicInfo: { ...state.resumeData.basicInfo, ...updates },
          },
          isDirty: true,
        })),

      // ── Photo ─────────────────────────────────────────────────────────

      updatePhoto: (photo) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            basicInfo: { ...state.resumeData.basicInfo, photo },
          },
          isDirty: true,
        })),

      updatePhotoConfig: (config) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            basicInfo: {
              ...state.resumeData.basicInfo,
              photoConfig: {
                ...state.resumeData.basicInfo.photoConfig,
                ...config,
              },
            },
          },
          isDirty: true,
        })),

      // ── Custom Fields ─────────────────────────────────────────────────

      addCustomField: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            basicInfo: {
              ...state.resumeData.basicInfo,
              customFields: [
                ...state.resumeData.basicInfo.customFields,
                {
                  id: crypto.randomUUID(),
                  label: '',
                  value: '',
                  icon: '',
                },
              ],
            },
          },
          isDirty: true,
        })),

      updateCustomField: (id, updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            basicInfo: {
              ...state.resumeData.basicInfo,
              customFields: state.resumeData.basicInfo.customFields.map((f) =>
                f.id === id ? { ...f, ...updates } : f,
              ),
            },
          },
          isDirty: true,
        })),

      removeCustomField: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            basicInfo: {
              ...state.resumeData.basicInfo,
              customFields: state.resumeData.basicInfo.customFields.filter(
                (f) => f.id !== id,
              ),
            },
          },
          isDirty: true,
        })),

      // ── Skills ────────────────────────────────────────────────────────

      updateSkill: (id, updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            skills: state.resumeData.skills.map((s) =>
              s.id === id ? { ...s, ...updates } : s,
            ),
          },
          isDirty: true,
        })),

      addSkill: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            skills: [
              ...state.resumeData.skills,
              { id: crypto.randomUUID(), name: '', description: '' },
            ],
          },
          isDirty: true,
        })),

      removeSkill: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            skills: state.resumeData.skills.filter((s) => s.id !== id),
          },
          isDirty: true,
        })),

      updateSkillsBatch: (items) =>
        set((state) => ({
          resumeData: { ...state.resumeData, skills: items },
          isDirty: true,
        })),

      // ── Experience ────────────────────────────────────────────────────

      updateExperience: (id, updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experience: state.resumeData.experience.map((e) =>
              e.id === id ? { ...e, ...updates } : e,
            ),
          },
          isDirty: true,
        })),

      addExperience: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experience: [
              ...state.resumeData.experience,
              {
                id: crypto.randomUUID(),
                company: '',
                position: '',
                startDate: '',
                endDate: '',
                highlights: [],
              },
            ],
          },
          isDirty: true,
        })),

      removeExperience: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experience: state.resumeData.experience.filter(
              (e) => e.id !== id,
            ),
          },
          isDirty: true,
        })),

      updateExperienceBatch: (items) =>
        set((state) => ({
          resumeData: { ...state.resumeData, experience: items },
          isDirty: true,
        })),

      // ── Projects ──────────────────────────────────────────────────────

      updateProject: (id, updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: state.resumeData.projects.map((p) =>
              p.id === id ? { ...p, ...updates } : p,
            ),
          },
          isDirty: true,
        })),

      addProject: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: [
              ...state.resumeData.projects,
              {
                id: crypto.randomUUID(),
                name: '',
                role: '',
                startDate: '',
                endDate: '',
                description: '',
                highlights: [],
              },
            ],
          },
          isDirty: true,
        })),

      removeProject: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: state.resumeData.projects.filter((p) => p.id !== id),
          },
          isDirty: true,
        })),

      updateProjectsBatch: (items) =>
        set((state) => ({
          resumeData: { ...state.resumeData, projects: items },
          isDirty: true,
        })),

      // ── Education ─────────────────────────────────────────────────────

      updateEducation: (id, updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: state.resumeData.education.map((e) =>
              e.id === id ? { ...e, ...updates } : e,
            ),
          },
          isDirty: true,
        })),

      addEducation: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: [
              ...state.resumeData.education,
              {
                id: crypto.randomUUID(),
                school: '',
                degree: '',
                major: '',
                startDate: '',
                endDate: '',
                description: '',
              },
            ],
          },
          isDirty: true,
        })),

      removeEducation: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: state.resumeData.education.filter(
              (e) => e.id !== id,
            ),
          },
          isDirty: true,
        })),

      updateEducationBatch: (items) =>
        set((state) => ({
          resumeData: { ...state.resumeData, education: items },
          isDirty: true,
        })),

      // ── Certificates ──────────────────────────────────────────────────

      addCertificate: () =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certificates: [
              ...state.resumeData.certificates,
              {
                id: crypto.randomUUID(),
                name: '',
                issuer: '',
                date: '',
                url: '',
              },
            ],
          },
          isDirty: true,
        })),

      updateCertificate: (id, updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certificates: state.resumeData.certificates.map((c) =>
              c.id === id ? { ...c, ...updates } : c,
            ),
          },
          isDirty: true,
        })),

      removeCertificate: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certificates: state.resumeData.certificates.filter(
              (c) => c.id !== id,
            ),
          },
          isDirty: true,
        })),

      // ── Custom Sections ───────────────────────────────────────────────

      addCustomSection: (title) =>
        set((state) => {
          const sectionId = crypto.randomUUID()
          return {
            resumeData: {
              ...state.resumeData,
              customSections: [
                ...state.resumeData.customSections,
                { id: sectionId, title, items: [] },
              ],
              menuSections: [
                ...state.resumeData.menuSections,
                {
                  id: sectionId,
                  title,
                  enabled: true,
                  order: state.resumeData.menuSections.length,
                },
              ],
            },
            isDirty: true,
          }
        }),

      removeCustomSection: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            customSections: state.resumeData.customSections.filter(
              (s) => s.id !== id,
            ),
            menuSections: state.resumeData.menuSections.filter(
              (s) => s.id !== id,
            ),
          },
          isDirty: true,
        })),

      addCustomSectionItem: (sectionId) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            customSections: state.resumeData.customSections.map((s) =>
              s.id === sectionId
                ? {
                    ...s,
                    items: [
                      ...s.items,
                      {
                        id: crypto.randomUUID(),
                        title: '',
                        subtitle: '',
                        dateRange: '',
                        description: '',
                        visible: true,
                      },
                    ],
                  }
                : s,
            ),
          },
          isDirty: true,
        })),

      updateCustomSectionItem: (sectionId, itemId, updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            customSections: state.resumeData.customSections.map((s) =>
              s.id === sectionId
                ? {
                    ...s,
                    items: s.items.map((item) =>
                      item.id === itemId ? { ...item, ...updates } : item,
                    ),
                  }
                : s,
            ),
          },
          isDirty: true,
        })),

      removeCustomSectionItem: (sectionId, itemId) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            customSections: state.resumeData.customSections.map((s) =>
              s.id === sectionId
                ? {
                    ...s,
                    items: s.items.filter((item) => item.id !== itemId),
                  }
                : s,
            ),
          },
          isDirty: true,
        })),

      // ── Sections ──────────────────────────────────────────────────────

      toggleSection: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            menuSections: state.resumeData.menuSections.map((s) =>
              s.id === id ? { ...s, enabled: !s.enabled } : s,
            ),
          },
          isDirty: true,
        })),

      reorderSections: (sections) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            menuSections: sections,
          },
          isDirty: true,
        })),

      // ── Settings ──────────────────────────────────────────────────────

      updateGlobalSettings: (updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            globalSettings: {
              ...state.resumeData.globalSettings,
              ...updates,
            },
          },
          isDirty: true,
        })),

      setThemeColor: (color) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            globalSettings: {
              ...state.resumeData.globalSettings,
              themeColor: color,
            },
          },
          isDirty: true,
        })),

      // ── UI ────────────────────────────────────────────────────────────

      setActiveSection: (section) => set({ activeSection: section }),

      setDirty: (dirty) => set({ isDirty: dirty }),
    }),
    {
      name: 'resume-editor-store',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
