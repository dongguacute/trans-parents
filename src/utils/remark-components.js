import { visit } from 'unist-util-visit';

export function rehypeComponents() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      
      // 处理 Alert 组件 - 将组件标签转换为带 class 的 div 标签
      if (node.tagName === 'alert') {
        node.tagName = 'div';
        node.properties = node.properties || {};
        node.properties.className = (node.properties.className || '') + ' alert';
        
        // 处理 Alert 的 type 属性
        if (node.properties.type) {
          node.properties.className += ` alert-${node.properties.type}`;
        }
        
        // 处理 title 属性，将其转换为标题元素
        if (node.properties.title) {
          // 创建标题元素
          const titleElement = {
            type: 'element',
            tagName: 'div',
            properties: { className: 'alert-title' },
            children: [{ type: 'text', value: node.properties.title }]
          };
          
          // 在内容前插入标题
          node.children = [titleElement, { type: 'element', tagName: 'div', properties: { className: 'alert-content' }, children: node.children }];
          
          // 删除原始的 title 属性
          delete node.properties.title;
        } else {
          // 如果没有标题，仍然需要包装内容
          node.children = [{ type: 'element', tagName: 'div', properties: { className: 'alert-content' }, children: node.children }];
        }
      }

      // 处理 ExpandableContent 组件 - 将组件标签转换为带 class 的 div 标签
      if (node.tagName === 'expandablecontent') {
        node.tagName = 'div';
        node.properties = node.properties || {};
        node.properties.className = (node.properties.className || '') + ' expandable-content';
        
        const contentId = `expandable-${Math.random().toString(36).substr(2, 9)}`;
        
        // 创建切换按钮
        const toggleButton = {
          type: 'element',
          tagName: 'button',
          properties: {
            className: 'expandable-toggle',
            'aria-expanded': node.properties.open === true || node.properties.open === 'true',
            'aria-controls': contentId,
            onclick: `toggleExpandable('${contentId}')`
          },
          children: [
            { type: 'element', tagName: 'span', properties: { className: 'toggle-icon' }, children: [{ type: 'text', value: (node.properties.open === true || node.properties.open === 'true') ? '▼' : '▶' }] },
            { type: 'element', tagName: 'span', properties: { className: 'toggle-title' }, children: [{ type: 'text', value: node.properties.title || 'Expandable Content' }] }
          ]
        };
        
        // 创建内容容器
        const contentContainer = {
          type: 'element',
          tagName: 'div',
          properties: {
            id: contentId,
            className: 'expandable-body',
            style: `display: ${(node.properties.open === true || node.properties.open === 'true') ? 'block' : 'none'};`
          },
          children: node.children
        };
        
        // 重新构建节点内容
        node.children = [toggleButton, contentContainer];
        
        // 删除已处理的属性
        delete node.properties.title;
        delete node.properties.open;
      }
    });
  };
}