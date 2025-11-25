import React from 'react';
import type { Project } from '../machines/portfolioMachine';

interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Project card component for the portfolio grid.
 * Displays project title, description, and tech stack.
 */
const ProjectCard: React.FC<ProjectCardProps> = ({ project, isSelected, onClick }) => {
  return (
    <div
      role="gridcell"
      tabIndex={-1}
      aria-selected={isSelected}
      onClick={onClick}
      className={`p-6 border-2 cursor-pointer transition-all duration-150 h-full ${
        isSelected
          ? 'border-ansi-green bg-ansi-green/10 shadow-glow-green scale-[1.02]'
          : 'border-ansi-green/30 hover:border-ansi-green/60'
      }`}
    >
      <h3 className={`text-lg font-bold mb-2 ${isSelected ? 'text-ansi-green' : 'text-ansi-green/80'}`}>
        {isSelected ? '▶ ' : '  '}
        {project.title}
      </h3>
      <p className="text-sm text-ansi-green/70 mb-4 line-clamp-3">{project.description}</p>
      <div className="flex flex-wrap gap-1">
        {project.technologies.slice(0, 4).map((tech) => (
          <span
            key={tech}
            className="text-xs px-2 py-0.5 border border-ansi-green/40 text-ansi-green/60"
          >
            {tech}
          </span>
        ))}
        {project.technologies.length > 4 && (
          <span className="text-xs px-2 py-0.5 text-ansi-green/40">
            +{project.technologies.length - 4}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;



