import type { Repository, Application } from './gitops';

export interface RepositoryListProps {
  onShowDetails: (repository: Repository) => void;
}

export interface ApplicationListProps {
  onShowDetails: (application: Application) => void;
}

export interface RepositoryDetailsProps {
  repository: Repository;
  onClose: () => void;
}

export interface ApplicationDetailsProps {
  application: Application;
  onClose: () => void;
}

export interface CreateRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface CreateApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: Repository[];
}

export interface DetailsState {
  type: 'repository' | 'application';
  data: Repository | Application;
}