import Layout from "./Layout.jsx";

import Home from "./Home";

import ProjectAnalysis from "./ProjectAnalysis";

import TaskView from "./TaskView";

import Projects from "./Projects";

import ProjectHealth from "./ProjectHealth";

import Settings from "./Settings";

import Visualization from "./Visualization";

import Deployment from "./Deployment";

import Agents from "./Agents";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    ProjectAnalysis: ProjectAnalysis,
    
    TaskView: TaskView,
    
    Projects: Projects,
    
    ProjectHealth: ProjectHealth,

    Settings: Settings,

    Visualization: Visualization,

    Deployment: Deployment,

    Agents: Agents,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/projectanalysis" element={<ProjectAnalysis />} />
                <Route path="/taskview" element={<TaskView />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projecthealth" element={<ProjectHealth />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/visualization" element={<Visualization />} />
                <Route path="/deployment" element={<Deployment />} />
                <Route path="/agents" element={<Agents />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}