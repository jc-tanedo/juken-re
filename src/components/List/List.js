import React from 'react';
import PropTypes from 'prop-types';
import List from 'src/components/List/ListWrapper';
import ListItem from 'src/components/List/ListItem';

function itemPosition(index, count) {
  if (count <= 1) return 'single';
  if (index === 0) return 'first';
  if (index === count - 1) return 'last';
  return 'middle';
}

const ListComponent = ({ list, lists = [] }) => {
  const useList = Array.isArray(lists) && lists.length > 0 ? lists : [list];

  return (
    <>
      {useList.filter(Boolean).map((l, i) => {
        const items = (l.items || []).filter(Boolean);
        return (
          <List key={l.title || `list-${i}`} title={l.title}>
            {items.map((item, idx) => (
              <ListItem
                key={item.id}
                position={itemPosition(idx, items.length)}
                {...item}
              />
            ))}
          </List>
        );
      })}
    </>
  );
};

ListComponent.propTypes = {
  list: PropTypes.object,
  lists: PropTypes.array,
};

export default ListComponent;
