import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as GlueBadJdbc from '../lib/glue-bad-jdbc-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new GlueBadJdbc.GlueBadJdbcStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
