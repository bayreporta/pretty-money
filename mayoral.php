
<?php
/*
	Template Name: Mayoral Candidates
*/	
	
 


get_header(); ?>
	<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
	<script src="http://oaktowndata.com/wp-content/js/tabletop.js"></script>
	<script src="http://oaktowndata.com/wp-content/js/chosen.jquery.js"></script>
	<script src="http://oaktowndata.com/wp-content/js/mayoral.js"></script>
	<div id="primary" class="site-content" style="width:100%">
		<div id="content" role="main">
			<div id="loading">
				<h1><strong></strong></h1>
				<p>this should only take a moment</p>
			</div>
			<div id="cand-intro">
				<div id="cand-header">
					<h2></h2>
					<h4></h4>
				</div>
				<div id="cand-photo">
					<img src="">
				</div>
				<div id="cand-summary">
					<p></p>
					<a href=""><p><strong>Oakland Wiki Page</strong></p></a>
					<a href=""><p><strong>View List of Contributors Here</strong></p></a>
				</div>
			
			</div><!-- #content -->
			<div id="cand-chart">
				<div id="cf-choose">
					<select id="overall-options" class="chosen-select" style="width:200px;float:left;" tabindex="2">
						<option value="Summary">Summary</option>
						<option value="Sectors">Sectors/Industries</option>
						<option value="Contributors">Top Contributors</option>
						<option value="Geography">Geography</option>
						<option value="Expenses">Expenses</option>
					</select>
				</div>
				<div id="cf-contribute" class="cf-canvas">
					<div class="cf-title" style="float:none;">
						<h2>Top Contributors 2013-2014</h2>
						<h4>Last Report 1/30/2014</h4>
					</div>
					<div id="top-employer" class="cf-infobox">
						<h4>Top Employers</h4>
						<ul>
							<li><span></span>: $<span></span></li>
							<li><span></span>: $<span></span></li>
							<li><span></span>: $<span></span></li>
							<li><span></span>: $<span></span></li>
							<li><span></span>: $<span></span></li>
						</ul>
					</div>
					<div class="highlights" id="cf-average">
						<h4></h4>
						<p>average reported contribution</p>
					</div>
					<div class="highlights" id="cf-no">
						<h4></h4>
						<p>number of contributions</p>
					</div>
				</div>
				<div id="cf-industry" class="cf-canvas">
					<div class="drill-bar-chart">
						<div class="cf-head">
							<div class="cf-title">
								<h2>Total Cash Raised 2013-2014</h2>
								<h4>Last Report 1/30/2014</h4>
							</div>
							<div class="cf-detail">
								<p><strong>Click to Go Back</strong></p>
							</div>	
						</div>
						
					</div>
				</div>
				<div id="cf-summary" class="cf-canvas">
					<div class="bar-chart">
						<div class="cf-head">
							<div class="cf-title">
								<h2>Overview of Campaign Finances</h2>
								<h4></h4>
							</div>
						</div>	
						<div class="bar-row" id="1">
							<div class="bar-label">
								<p class="the-label">Cash Raised</p>
							</div>
							<div class="bar-data">
								<p></p>
							</div>
						</div>
						<div class="bar-row" id="2">
							<div class="bar-label">
								<p class="the-label">Cash Spent</p>
							</div>
							<div class="bar-data">
								<p></p>
							</div>
						</div>
						<div class="bar-row" id="3">
							<div class="bar-label">
								<p class="the-label">Loans</p>
							</div>
							<div class="bar-data">
								<p></p>
							</div>
						</div>
						<div class="bar-row" id="4">
							<div class="bar-label">
								<p class="the-label">Non-Cash Contributions</p>
							</div>
							<div class="bar-data">
								<p></p>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div id="cand-highlight">
				<h2>Candidate Highlights</h2>
				<div class="highlights" id="raise-rank">
					<h4></h4>
					<p>in raising money</p>
				</div>
				<div class="highlights" id="spend-rank">
					<h4></h4>
					<p>in spending money</p>
				</div>
				<div class="highlights" id="cash-hand">
					<h4></h4>
					<p>war chest after expenses</p>
				</div>
			</div>
			<div id="cand-nointerface">
				<h1><strong>No Finances Detected</strong></h1>
				<p>this candidate hasn't disclosed any finances to-date</p>
			</div>
	</div><!-- #primary -->
<?php get_footer(); ?>
