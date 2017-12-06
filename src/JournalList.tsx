import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';

import { List, ListItem } from 'material-ui/List';
import Paper from 'material-ui/Paper';

import * as EteSync from './api/EteSync';

import { routeResolver } from './App';
import { JournalsType, StoreState, CredentialsData } from './store';

interface PropsType {
  etesync: CredentialsData;
}

interface PropsTypeInner extends PropsType {
  journals: JournalsType;
}

class JournalList extends React.Component {
  props: PropsTypeInner;

  constructor(props: any) {
    super(props);
  }

  render() {
    if (this.props.journals.value === null) {
      return (<div/>);
    }

    const derived = this.props.etesync.encryptionKey;
    const journalMap = this.props.journals.value.filter((x) => (
        // Skip shared journals for now.
        !x.key
      )).reduce(
      (ret, journal) => {
        let cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
        let info = journal.getInfo(cryptoManager);
        ret[info.type] = ret[info.type] || [];
        ret[info.type].push(
          <Link
            key={journal.uid}
            to={routeResolver.getRoute('journals._id', { journalUid: journal.uid })}
          >
            <ListItem>
              {info.displayName} ({journal.uid.slice(0, 5)})
            </ListItem>
          </Link>
        );
        return ret;
      },
      { CALENDAR: [],
        ADDRESS_BOOK: []});

    const styles = {
      holder: {
        margin: 'auto',
        maxWidth: 400,
        padding: 20,
      },
      paper: {
        padding: 20,
      },
    };

    return (
      <div style={styles.holder}>
      <Paper style={styles.paper} zDepth={2}>
        <h2>Address Books</h2>
        <List>
          {journalMap.ADDRESS_BOOK}
        </List>

        <h2>Calendars</h2>
        <List>
          {journalMap.CALENDAR}
        </List>
      </Paper>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState, props: PropsType) => {
  return {
    journals: state.cache.journals,
  };
};

export default withRouter(connect(
  mapStateToProps
)(JournalList));
