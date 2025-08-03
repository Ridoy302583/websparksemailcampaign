import React from 'react';

interface CategoryTabsProps {
  categories: { name: string; count: number; key: string }[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'all':
        return 'bi-collection';
      case 'newsletter':
        return 'bi-newspaper';
      case 'promotional':
        return 'bi-megaphone';
      case 'transactional':
        return 'bi-receipt';
      case 'welcome':
        return 'bi-hand-thumbs-up';
      default:
        return 'bi-folder';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.key}
          onClick={() => onCategoryChange(category.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow font-medium transition-all duration-200 ${
            activeCategory === category.key
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-white text-gray-600 hover:bg-gray-200 border border-transparent'
          }`}
        >
          <i className={`${getCategoryIcon(category.key)} text-sm`}></i>
          <span>{category.name}</span>
          <span className="bg-white px-2 py-0.5 rounded-full text-xs font-semibold">
            {category.count}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
