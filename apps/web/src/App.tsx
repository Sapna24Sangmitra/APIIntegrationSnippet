import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Header from './components/Header'
import LandingPage from './pages/LandingPage'
import SnippetView from './pages/SnippetView'
import Marketplace from './pages/Marketplace'
import MCPIntegration from './pages/MCPIntegration'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-black">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/snippet/:id" element={<SnippetView />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/mcp" element={<MCPIntegration />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
