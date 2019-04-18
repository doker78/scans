var async = require('async');
var helpers = require('../../../helpers/aws');

module.exports = {
	title: 'Open Hadoop HDFS NameNode Metadate Service',
	category: 'EC2',
	description: 'Determine if TCP port 8020 for HDFS NameNode metadata service is open to the public',
	more_info: 'While some ports such as HTTP and HTTPS are required to be open to the public to function properly, more sensitive services such as Hadoop/HDFS should be restricted to known IP addresses.',
	link: 'https://ambari.apache.org/1.2.3/installing-hadoop-using-ambari/content/reference_chap2_1.html',
	recommended_action: 'Restrict TCP port 8020 to known IP addresses for Hadoop/HDFS',
	apis: ['EC2:describeSecurityGroups'],

	run: function(cache, settings, callback) {
		var results = [];
		var source = {};
		var regions = helpers.regions(settings.govcloud);

		var ports = {
			'tcp': [8020]
		};

		var service = 'HDFSNameNodeMetadataService';

		async.each(regions.ec2, function(region, rcb){
			var describeSecurityGroups = helpers.addSource(cache, source,
				['ec2', 'describeSecurityGroups', region]);

			if (!describeSecurityGroups) return rcb();

			if (describeSecurityGroups.err || !describeSecurityGroups.data) {
				helpers.addResult(results, 3,
					'Unable to query for security groups: ' + helpers.addError(describeSecurityGroups), region);
				return rcb();
			}

			if (!describeSecurityGroups.data.length) {
				helpers.addResult(results, 0, 'No security groups present', region);
				return rcb();
			}

			helpers.findOpenPorts(describeSecurityGroups.data, ports, service, region, results);

			rcb();
		}, function(){
			callback(null, results, source);
		});
	}
};