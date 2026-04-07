import { Route, Routes } from 'react-router-dom'
import './App.css'
import { ReviewPage } from './pages/ReviewPage'
import TemplateLibraryPage from './pages/TemplateLibraryPage'
import ResumeEditorPage from './pages/ResumeEditorPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<ReviewPage />} />
      <Route path="/templates" element={<TemplateLibraryPage />} />
      <Route path="/editor" element={<ResumeEditorPage />} />
    </Routes>
  )
}

export default App
